import { ParsedLokiRecord } from 'features/parseLokiLogs/parseLokiLogs.types';
import { StatefulTimepoint, UnixTimestamp } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';

export type RumAvailability = 'unknown' | 'present' | 'absent';

export type RumAvailabilityEvent =
  | { type: 'passive-success' }
  | { type: 'probe-result'; result: 'present' | 'absent' }
  | { type: 'probe-error' };

export const FARO_RUM_PROBE_EXECUTION_ID_CAP = 50;

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

/**
 * Existence probe across a capped set of execution ids for the current check.
 * Uses a regex OR so one Loki query can tell us whether *any* of these runs
 * produced Faro sessions (check-level RUM availability).
 */
export function buildFaroSessionProbeLogQL(executionIds: string[]): string {
  const uniqueIds = [...new Set(executionIds.filter(Boolean))].slice(0, FARO_RUM_PROBE_EXECUTION_ID_CAP);
  if (uniqueIds.length === 0) {
    return '';
  }

  const escaped = uniqueIds.map(escapeLogQLRegex).join('|');
  return `{kind=~"event|measurement"} | logfmt | k6_isK6Browser="true" | k6_testRunId=~"sm:(${escaped})"`;
}

function escapeLogQLRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function collectExecutionIdsFromListLogsMap(
  listLogsMap: Record<UnixTimestamp, StatefulTimepoint>,
  cap = FARO_RUM_PROBE_EXECUTION_ID_CAP
): { executionIds: string[]; from: number; to: number } {
  const ids: string[] = [];
  const seen = new Set<string>();
  let from = Number.POSITIVE_INFINITY;
  let to = 0;

  const timepoints = Object.values(listLogsMap).sort((a, b) => b.adjustedTime - a.adjustedTime);

  for (const timepoint of timepoints) {
    const executions = Object.values(timepoint.probeResults ?? {}).flat();
    for (const execution of executions) {
      const executionId = execution.labels?.execution_id;
      if (!executionId || seen.has(executionId)) {
        continue;
      }

      seen.add(executionId);
      ids.push(executionId);
      from = Math.min(from, timepoint.adjustedTime);
      to = Math.max(to, timepoint.adjustedTime + timepoint.timepointDuration + timepoint.config.frequency);

      if (ids.length >= cap) {
        return { executionIds: ids, from, to };
      }
    }
  }

  if (ids.length === 0) {
    return { executionIds: [], from: 0, to: 0 };
  }

  return { executionIds: ids, from, to };
}

/**
 * Check-level RUM availability. `present` is sticky for the explorer session —
 * neither a later empty probe nor a probe error can demote it.
 */
export function reduceRumAvailability(
  current: RumAvailability,
  event: RumAvailabilityEvent
): RumAvailability {
  if (current === 'present') {
    return 'present';
  }

  if (event.type === 'passive-success') {
    return 'present';
  }

  if (event.type === 'probe-result') {
    return event.result;
  }

  return current;
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
