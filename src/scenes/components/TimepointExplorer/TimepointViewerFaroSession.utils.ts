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

interface FaroSessionIds {
  appId: string;
  sessionId: string;
}

/**
 * Extracts the app_id / session_id pair from the first parsed log record that
 * contains both. Returns null if nothing usable was found so callers can hide
 * the CTA.
 */
export function getFaroSessionFromLogs(
  logs: Array<ParsedLokiRecord<Record<string, string>, Record<string, string>>>
): FaroSessionIds | null {
  for (const record of logs) {
    const labels = record.labels ?? {};
    const appId = labels.app_id;
    const sessionId = labels.session_id;

    if (appId && sessionId) {
      return { appId, sessionId };
    }
  }

  return null;
}

interface BuildFaroSessionHrefParams extends FaroSessionIds {
  pluginId: string;
}

export function buildFaroSessionHref({ pluginId, appId, sessionId }: BuildFaroSessionHrefParams): string {
  return `/a/${encodeURIComponent(pluginId)}/apps/${encodeURIComponent(appId)}/sessions/${encodeURIComponent(sessionId)}`;
}
