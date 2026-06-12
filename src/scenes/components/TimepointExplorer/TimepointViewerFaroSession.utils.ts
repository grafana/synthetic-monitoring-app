import { ParsedLokiRecord } from 'features/parseLokiLogs/parseLokiLogs.types';

// RE2 escape for regex special characters we want to treat literally inside
// the k6_testRunId regex match below.
export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

interface BuildFaroSessionLogQLParams {
  job: string;
  instance: string;
  probe: string;
}

/**
 * Returns an unanchored regex fragment that matches a single `"<key>":"<value>"`
 * occurrence inside a JSON-encoded string. Wrapping in `.*...*` is required for
 * Loki's label filter `=~`, which is anchored.
 */
function jsonFieldPattern(key: string, value: string): string {
  return `.*"${key}":"${escapeRegex(value)}".*`;
}

/**
 * Builds a LogQL expression that finds Faro web events emitted by the k6
 * browser test that powered the given probe execution. The query:
 *
 * 1. Narrows the stream selector to Faro events/measurements (`kind`).
 * 2. Uses `logfmt` to parse body fields into labels.
 * 3. Filters to k6 browser runs only.
 * 4. Matches `job`, `instance` and `probe` independently against the
 *    `k6_testRunId` JSON blob using one label filter per key. Independent
 *    filters mean we don't depend on the JSON key order produced by the
 *    upstream agent — only that the keys exist with the expected values.
 *
 * The k6_testRunId value is produced by grafana/xk6-sm and currently has the
 * shape: {"job":"<job>","instance":"<instance>","probe":"<probe>"}
 */
export function buildFaroSessionLogQL({ job, instance, probe }: BuildFaroSessionLogQLParams): string {
  const filters = [
    `k6_testRunId=~\`${jsonFieldPattern('job', job)}\``,
    `k6_testRunId=~\`${jsonFieldPattern('instance', instance)}\``,
    `k6_testRunId=~\`${jsonFieldPattern('probe', probe)}\``,
  ];

  return `{kind=~"event|measurement"} | logfmt | k6_isK6Browser="true" | ${filters.join(' | ')}`;
}

/**
 * Builds a LogQL expression that finds the Faro web events for a specific check
 * run, keyed on the run's execution id. Newer agents stamp each check run with
 * an `execution_id` (Loki structured metadata) and inject it into the browser
 * test so the Faro session's `k6_testRunId` is exactly `sm:<execution_id>`.
 *
 * This is an exact match, so it does not depend on the time window, the JSON
 * shape of `k6_testRunId`, or the job/instance/probe values — it pins the
 * session to the precise execution the user selected.
 */
export function buildFaroSessionByExecutionIdLogQL(executionId: string): string {
  return `{kind=~"event|measurement"} | logfmt | k6_isK6Browser="true" | k6_testRunId="sm:${executionId}"`;
}

interface FaroSessionIds {
  appId: string;
  sessionId: string;
}

/**
 * Resolves the app_id / session_id of the Faro session that actually holds the
 * browser-check recording.
 *
 * A single browser-check run can emit *several* Faro sessions: the Web SDK
 * creates a short-lived session on first paint (just `session_start` +
 * `session_recording.started`) and then **rotates** to a new session that
 * carries the rest of the journey and the real Session Replay. The rotation is
 * recorded as `session_attr_previousSession=<old id>` on the new session.
 *
 * Records arrive oldest-first, so naively taking the first one returns the
 * throwaway stub — whose replay is a single frame (0:00). Instead we:
 *   1. skip any session that was rotated *away from* (appears as another
 *      record's `previousSession`), and
 *   2. among the rest, pick the session with the most matching records (the
 *      real journey always has more than the 2-event stub), tie-breaking on
 *      first appearance for determinism.
 *
 * Returns null if nothing usable was found so callers can hide the CTA.
 */
export function getFaroSessionFromLogs(
  logs: Array<ParsedLokiRecord<Record<string, string>, Record<string, string>>>
): FaroSessionIds | null {
  const sessions = new Map<string, { appId: string; sessionId: string; count: number; firstIndex: number }>();
  const rotatedAway = new Set<string>();

  logs.forEach((record, index) => {
    const labels = record.labels ?? {};

    const previousSession = labels.session_attr_previousSession;
    if (previousSession) {
      rotatedAway.add(previousSession);
    }

    const appId = labels.app_id;
    const sessionId = labels.session_id;
    if (!appId || !sessionId) {
      return;
    }

    const existing = sessions.get(sessionId);
    if (existing) {
      existing.count += 1;
    } else {
      sessions.set(sessionId, { appId, sessionId, count: 1, firstIndex: index });
    }
  });

  if (sessions.size === 0) {
    return null;
  }

  const candidates = [...sessions.values()];
  // Prefer the session Faro settled on (not rotated away from). Only fall back
  // to the full set if every matching session was rotated away.
  const notRotatedAway = candidates.filter((c) => !rotatedAway.has(c.sessionId));
  const pool = notRotatedAway.length > 0 ? notRotatedAway : candidates;

  pool.sort((a, b) => b.count - a.count || a.firstIndex - b.firstIndex);
  const best = pool[0];

  return { appId: best.appId, sessionId: best.sessionId };
}

interface BuildFaroSessionHrefParams extends FaroSessionIds {
  pluginId: string;
}

export function buildFaroSessionHref({ pluginId, appId, sessionId }: BuildFaroSessionHrefParams): string {
  return `/a/${encodeURIComponent(pluginId)}/apps/${encodeURIComponent(appId)}/sessions/${encodeURIComponent(sessionId)}`;
}
