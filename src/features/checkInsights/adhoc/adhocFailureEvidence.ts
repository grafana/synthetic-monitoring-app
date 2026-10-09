import {
  AdHocCheckState,
  LogEntry,
  ProbeStateStatus,
} from 'components/Checkster/feature/adhoc-check/types.adhoc-check';
import { getLogLevelFromMessage, getProbeSuccess } from 'components/Checkster/feature/adhoc-check/utils';

const MAX_LINES = 5;
const MAX_LINE_LENGTH = 300;
const ASSERTION_FAILURE_PREFIX = 'Failed assertion: ';
const TIMEOUT_TEXT = 'The test timed out before the probe reported any results.';

// Wrapper messages that restate "something broke" without saying what. Best effort, not exhaustive.
const GENERIC_CRITICAL_PATTERNS = [
  /^(?:\w+:\s*)?check failed$/i,
  /^(?:\w+:\s*)?uncaught error occurred while running the script$/i,
  /^(?:\w+:\s*)?script exception$/i,
];

export interface AdhocFailureLine {
  text: string;
  /** 'critical' lines are the root cause. 'context' lines are consequences or supporting detail. */
  severity: 'critical' | 'context';
}

export interface AdhocFailureEvidence {
  failingProbes: string[];
  lines: AdhocFailureLine[];
}

function summarizeLog(log: LogEntry): AdhocFailureLine | null {
  // Script checks log one "check result" line per assertion, passing or failing.
  if (log.msg === 'check result' || ('check' in log && 'value' in log)) {
    const { check, value } = log as { check?: string; value?: string };
    return value === '1'
      ? null
      : { text: `${ASSERTION_FAILURE_PREFIX}"${check ?? 'unknown check'}"`, severity: 'context' };
  }

  const detail = (log.error ?? log.msg)
    ?.split(/\r?\n/)
    .find((line) => line.trim())
    ?.trim();
  if (!detail) {
    return null;
  }

  const level = getLogLevelFromMessage(log.msg, log.level);
  const isError = level === 'error' || Boolean(log.error);
  const text = log.level ? `${log.level}: ${detail}` : detail;
  return { text: text.slice(0, MAX_LINE_LENGTH), severity: isError ? 'critical' : 'context' };
}

function dedupeByText(lines: Array<AdhocFailureLine | null>): AdhocFailureLine[] {
  const seen = new Set<string>();
  return lines.filter((line): line is AdhocFailureLine => {
    if (!line || seen.has(line.text)) {
      return false;
    }
    seen.add(line.text);
    return true;
  });
}

// A generic wrapper next to the specific cause would bury it, so demote it, but only when a
// specific critical line exists. Otherwise leave everything critical rather than highlight nothing.
function deprioritizeGenericLines(lines: AdhocFailureLine[]): AdhocFailureLine[] {
  const critical = lines.filter((line) => line.severity === 'critical');
  const isGeneric = (line: AdhocFailureLine) =>
    GENERIC_CRITICAL_PATTERNS.some((pattern) => pattern.test(line.text.trim()));
  if (critical.length <= 1 || critical.every(isGeneric)) {
    return lines;
  }
  return lines.map((line) =>
    line.severity === 'critical' && isGeneric(line) ? { ...line, severity: 'context' } : line
  );
}

// A failed assertion is the only concrete evidence when nothing else is critical, so promote it.
function promoteAssertions(lines: AdhocFailureLine[]): AdhocFailureLine[] {
  if (lines.some((line) => line.severity === 'critical')) {
    return lines;
  }
  return lines.map((line) =>
    line.text.startsWith(ASSERTION_FAILURE_PREFIX) ? { ...line, severity: 'critical' } : line
  );
}

// Critical lines always survive the cap, then the most recent context lines fill what's left.
function selectTopLines(lines: AdhocFailureLine[]): AdhocFailureLine[] {
  const critical = lines.filter((line) => line.severity === 'critical').slice(0, MAX_LINES);
  const context = lines.filter((line) => line.severity === 'context').slice(0, MAX_LINES - critical.length);
  const selected = new Set([...critical, ...context]);
  return lines.filter((line) => selected.has(line));
}

/**
 * What went wrong in one ad hoc run, or undefined while the run is still pending or when every
 * probe succeeded. Lines are most recent first.
 */
export function getAdhocFailureEvidence(run: AdHocCheckState): AdhocFailureEvidence | undefined {
  const probes = Object.values(run.probeState);
  if (probes.some(({ state }) => state === ProbeStateStatus.Pending)) {
    return undefined;
  }

  const failing = probes.filter(({ state, timeseries }) => {
    const status = getProbeSuccess(state, timeseries);
    return status === ProbeStateStatus.Error || status === ProbeStateStatus.Timeout;
  });
  if (!failing.length) {
    return undefined;
  }

  const rawLines = failing.flatMap(({ state, logs }) => [
    ...(state === ProbeStateStatus.Timeout ? [{ text: TIMEOUT_TEXT, severity: 'critical' as const }] : []),
    ...[...(logs ?? [])].reverse().map(summarizeLog),
  ]);

  return {
    failingProbes: failing.map(({ name }) => name),
    lines: selectTopLines(promoteAssertions(deprioritizeGenericLines(dedupeByText(rawLines)))),
  };
}
