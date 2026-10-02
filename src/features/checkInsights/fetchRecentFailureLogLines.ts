import { FetchResponse, getBackendSrv } from '@grafana/runtime';
import { firstValueFrom } from 'rxjs';

import { Check } from 'types';

// How much of the failing stream to pull before filtering client-side. Needs to be generous:
// a browser/scripted check logs one line per script assertion plus any error lines, so the true
// root cause (e.g. a TLS error that aborts the script early) can sit well before the most recent
// handful of lines, which are often just repeated downstream assertion failures caused by it.
const QUERY_LIMIT = 200;
const MAX_LOG_LINES = 5;
const MAX_LOG_LINE_LENGTH = 300;

interface LokiQueryRangeResponse {
  data: {
    result: Array<{
      stream: Record<string, string>;
      values: Array<[string, string]>;
    }>;
  };
}

function parseLogfmtFields(line: string): Record<string, string> {
  const fields: Record<string, string> = {};
  const pattern = /([\w.-]+)=("(?:[^"\\]|\\.)*"|\S*)/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(line)) !== null) {
    const [, key, rawValue] = match;
    const value =
      rawValue.startsWith('"') && rawValue.endsWith('"')
        ? rawValue.slice(1, -1).replace(/\\(.)/g, '$1')
        : rawValue;
    fields[key] = value;
  }

  return fields;
}

export interface FailureLogLine {
  text: string;
  // 'critical' lines are the actual root cause (network/DNS/TLS errors, timeouts, ...) — the
  // thing that made the check fail. 'context' lines are consequences of that root cause (a
  // downstream assertion failing because of it), useful supporting evidence but not the cause
  // itself. See the QUERY_LIMIT comment above: the root cause often sits earlier in the stream
  // than the assertion failures it triggers.
  severity: 'critical' | 'context';
}

export interface RecentFailureEvidence {
  lines: FailureLogLine[];
  // Every probe/location seen failing in the query window (the `probe` stream label), deduped —
  // kept as one flat summary rather than tagging it onto individual lines, since the same
  // message often comes from several probes at once and repeating it per probe (or merging
  // probes into the one line's attribution) just made the evidence panel noisier without
  // adding anything a single "failing from: X, Y, Z" line doesn't already say.
  failingProbes: string[];
}

/**
 * Turns one raw logfmt log line into a short, human-readable failure reason, or null if the
 * line isn't useful evidence.
 *
 * SM's script-based checks (browser/scripted) log one `msg="check result"` line per assertion,
 * pass or fail — those passing (`value="1"`) are noise, since surfacing them just crowds out the
 * real error within the small line budget below. Anything else (network/DNS/TLS errors,
 * timeouts, ...) already carries the actual diagnostic text in `msg` or `error`.
 *
 * A line only counts as 'critical' when its own level says so (`level=error`, or an `error`
 * field present) — plain `level=info` lines ("Beginning check", "resolved k6 version", ...) are
 * lifecycle narration, not evidence, even though they still carry a `msg`.
 */
const ASSERTION_FAILURE_PREFIX = 'Failed assertion: ';

function summarizeFailureLine(line: string): FailureLogLine | null {
  const fields = parseLogfmtFields(line);

  if (fields.msg === 'check result') {
    return fields.value === '1'
      ? null
      : { text: `${ASSERTION_FAILURE_PREFIX}"${fields.check ?? 'unknown check'}"`, severity: 'context' };
  }

  const detail = fields.error ?? fields.msg;
  if (!detail) {
    return null;
  }

  const isError = fields.level === 'error' || Boolean(fields.error);
  const text = fields.level ? `${fields.level}: ${detail}` : detail;
  return { text: text.slice(0, MAX_LOG_LINE_LENGTH), severity: isError ? 'critical' : 'context' };
}

/**
 * Drops nulls (passing assertions) and repeats of the same failure reason — the same message
 * showing up on several probes at once is already captured by `failingProbes` above, so a line
 * doesn't need to be kept (or repeated) per probe here. Keeps most-recent-first order.
 */
function dedupeByText(lines: Array<FailureLogLine | null>): FailureLogLine[] {
  const seenText = new Set<string>();
  return lines.filter((line): line is FailureLogLine => {
    if (!line || seenText.has(line.text)) {
      return false;
    }
    seenText.add(line.text);
    return true;
  });
}

// Generic wrapper messages that show up around the actual error rather than describing it —
// a script runtime or top-level handler restating "something broke" without saying what. Best
// effort, not exhaustive: matched so the specific line underneath (e.g. the actual timeout or
// TLS error) gets to be the one thing that's highlighted, instead of every level in the wrapper
// all getting equal billing.
const GENERIC_CRITICAL_PATTERNS = [
  /^(?:\w+:\s*)?check failed$/i,
  /^(?:\w+:\s*)?uncaught error occurred while running the script$/i,
  /^(?:\w+:\s*)?script exception$/i,
];

function isGenericCriticalLine(line: FailureLogLine): boolean {
  return GENERIC_CRITICAL_PATTERNS.some((pattern) => pattern.test(line.text.trim()));
}

/**
 * When several lines are all flagged 'critical', a generic wrapper message ("Check failed") and
 * the actual specific cause ("TLS handshake timeout") often show up side by side — highlighting
 * both equally buries the one that's actually useful. Demotes the generic ones to 'context', but
 * only when a more specific critical line survives; if every critical line we have is generic,
 * leave them all critical rather than end up highlighting nothing at all.
 */
function deprioritizeGenericCriticalLines(lines: FailureLogLine[]): FailureLogLine[] {
  const criticalLines = lines.filter((line) => line.severity === 'critical');
  const hasSpecificCritical = criticalLines.some((line) => !isGenericCriticalLine(line));

  if (criticalLines.length <= 1 || !hasSpecificCritical) {
    return lines;
  }

  return lines.map((line) =>
    line.severity === 'critical' && isGenericCriticalLine(line) ? { ...line, severity: 'context' } : line
  );
}

/**
 * A failed assertion is filed as 'context' (a consequence) whenever there's a more specific
 * 'critical' line — a network/TLS/timeout error — that actually caused it. But plenty of checks
 * fail with nothing else in the logs but the assertion itself (e.g. "Status code is 200" simply
 * didn't hold) — there, the assertion IS the only concrete evidence, so promote it rather than
 * leaving every line 'context' and telling the model the evidence is too thin to say anything.
 */
function promoteAssertionsWhenNoOtherCriticalLine(lines: FailureLogLine[]): FailureLogLine[] {
  if (lines.some((line) => line.severity === 'critical')) {
    return lines;
  }

  return lines.map((line) =>
    line.text.startsWith(ASSERTION_FAILURE_PREFIX) ? { ...line, severity: 'critical' } : line
  );
}

/**
 * Caps the line count without letting 'critical' lines get pushed out by newer 'context' ones.
 * Within a single failing run, the root cause (e.g. a TLS error early in the script) logs
 * *before* the assertion failures it goes on to trigger — so under a plain most-recent-first
 * truncation, a run with more than MAX_LOG_LINES lines would drop the one line that actually
 * explains the failure and keep only its consequences. Guarantees every 'critical' line survives
 * (up to the budget), then fills any remaining slots with the most recent 'context' lines, while
 * keeping the original most-recent-first relative order in the result.
 */
function selectTopLines(lines: FailureLogLine[]): FailureLogLine[] {
  const critical = lines.filter((line) => line.severity === 'critical').slice(0, MAX_LOG_LINES);
  const contextBudget = MAX_LOG_LINES - critical.length;
  const context = lines.filter((line) => line.severity === 'context').slice(0, contextBudget);
  const selected = new Set<FailureLogLine>([...critical, ...context]);

  return lines.filter((line) => selected.has(line));
}

/**
 * Short, human-readable failure reasons for the check's recent unsuccessful executions, most
 * recent first. This is the concrete "what actually happened" detail (timeouts, TLS errors,
 * assertion failures, ...) that a bare reachability percentage or alert name can't convey.
 */
export async function fetchRecentFailureLogLines(
  logsUrl: string,
  check: Check,
  startSeconds: number,
  endSeconds: number
): Promise<RecentFailureEvidence> {
  if (!logsUrl) {
    return { lines: [], failingProbes: [] };
  }

  try {
    const query = `{probe=~".+", instance="${check.target}", job="${check.job}", probe_success="0"}`;
    const response = (await firstValueFrom(
      getBackendSrv().fetch<LokiQueryRangeResponse>({
        method: 'GET',
        url: `${logsUrl}/loki/api/v1/query_range`,
        params: {
          query,
          // Loki's HTTP API takes start/end in nanoseconds; getStartEnd() gives unix seconds.
          start: startSeconds * 1e9,
          end: endSeconds * 1e9,
          limit: QUERY_LIMIT,
          direction: 'backward',
        },
      })
    )) as FetchResponse<LokiQueryRangeResponse>;

    // Each Loki stream carries its own label set — the `probe` label from the query selector
    // above — so it has to be captured here, per entry, before flattening throws it away.
    const rawEntries = response.data.data.result
      .flatMap((stream) => stream.values.map(([timestamp, line]) => ({ timestamp, line, probe: stream.stream.probe })))
      // Loki timestamps are nanosecond epoch strings (19 digits) — well past Number's 2^53 safe
      // integer range, so `Number(a) - Number(b)` silently loses the precision that actually
      // orders same-execution log lines. BigInt keeps the comparison exact.
      .sort((a, b) => {
        const diff = BigInt(b.timestamp) - BigInt(a.timestamp);
        return diff > BigInt(0) ? 1 : diff < BigInt(0) ? -1 : 0;
      });

    // From every raw entry, not just the summarized/capped lines below — a probe that only
    // ever produced lines cut off by MAX_LOG_LINES should still show up as currently failing.
    const failingProbes = Array.from(new Set(rawEntries.map((entry) => entry.probe).filter(Boolean)));

    const summarized = promoteAssertionsWhenNoOtherCriticalLine(
      deprioritizeGenericCriticalLines(dedupeByText(rawEntries.map((entry) => summarizeFailureLine(entry.line))))
    );

    if (summarized.length > 0) {
      return { lines: selectTopLines(summarized), failingProbes };
    }

    // Nothing matched the expected shape (unexpected log format for this check type) — fall
    // back to raw lines so the model still gets *something*, even if it's noisier. Unstructured,
    // so we can't confidently call any of them the root cause — treat them all as context.
    const fallbackLines = rawEntries
      .slice(0, MAX_LOG_LINES)
      .map((entry) => ({ text: entry.line.slice(0, MAX_LOG_LINE_LENGTH), severity: 'context' as const }));
    return { lines: fallbackLines, failingProbes };
  } catch {
    return { lines: [], failingProbes: [] };
  }
}
