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

/**
 * Turns one raw logfmt log line into a short, human-readable failure reason, or null if the
 * line isn't useful evidence.
 *
 * SM's script-based checks (browser/scripted) log one `msg="check result"` line per assertion,
 * pass or fail — those passing (`value="1"`) are noise, since surfacing them just crowds out the
 * real error within the small line budget below. Anything else (network/DNS/TLS errors,
 * timeouts, ...) already carries the actual diagnostic text in `msg` or `error`.
 */
function summarizeFailureLine(line: string): string | null {
  const fields = parseLogfmtFields(line);

  if (fields.msg === 'check result') {
    return fields.value === '1' ? null : `Failed assertion: "${fields.check ?? 'unknown check'}"`;
  }

  const detail = fields.error ?? fields.msg;
  if (!detail) {
    return null;
  }

  return fields.level ? `${fields.level}: ${detail}` : detail;
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
): Promise<string[]> {
  if (!logsUrl) {
    return [];
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

    const rawLines = response.data.data.result
      .flatMap((stream) => stream.values)
      // Loki timestamps are nanosecond epoch strings (19 digits) — well past Number's 2^53 safe
      // integer range, so `Number(a) - Number(b)` silently loses the precision that actually
      // orders same-execution log lines. BigInt keeps the comparison exact.
      .sort((a, b) => {
        const diff = BigInt(b[0]) - BigInt(a[0]);
        return diff > BigInt(0) ? 1 : diff < BigInt(0) ? -1 : 0;
      })
      .map(([, line]) => line);

    const summarized = Array.from(
      new Set(rawLines.map(summarizeFailureLine).filter((line): line is string => line !== null))
    );

    if (summarized.length > 0) {
      return summarized.slice(0, MAX_LOG_LINES);
    }

    // Nothing matched the expected shape (unexpected log format for this check type) — fall
    // back to raw lines so the model still gets *something*, even if it's noisier.
    return rawLines.slice(0, MAX_LOG_LINES).map((line) => line.slice(0, MAX_LOG_LINE_LENGTH));
  } catch {
    return [];
  }
}
