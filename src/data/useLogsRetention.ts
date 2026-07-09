import { useQuery } from '@tanstack/react-query';
import { config } from '@grafana/runtime';
import { queryLoki } from 'features/queryDatasources/queryLoki';

import { useLogsDS } from 'hooks/useLogsDS';

export const REF_ID_LOGS_RETENTION_CANARY = 'logsRetentionCanary';

const FREE_TRIAL_RETENTION_DAYS = 14;
const STANDARD_RETENTION_DAYS = 31;

const MILLISECONDS_IN_DAY = 24 * 60 * 60 * 1000;

// the canary query needs to target a window older than any retention period we could realistically
// encounter so that Loki is guaranteed to reject it when a lookback limit is enforced
const CANARY_END_OFFSET = 10 * 365 * MILLISECONDS_IN_DAY;
const CANARY_WINDOW = 60 * 1000;

// https://grafana.com/docs/loki/latest/query/troubleshoot-query/#error-data-is-no-longer-available
export const MAX_QUERY_LOOKBACK_ERROR = 'it is past now - max_query_lookback';

export type LogsRetention =
  | { type: 'known'; periodMs: number }
  // no lookback limit is enforced for the tenant so we can't infer retention from Loki.
  // Consumers should query the requested range and let the returned data speak for itself.
  | { type: 'unknown' };

interface UseLogsRetentionPeriodResult {
  isLoading: boolean;
  // null when retention couldn't be determined and no clamping should be applied
  retentionPeriod: number | null;
}

// There is no endpoint available to plugins which exposes a tenant's logs retention period
// (it lives in gcom). Instead we send a "canary" query to the Loki datasource that is deliberately
// far outside any plausible retention period: Loki rejects queries that fall entirely outside
// `max_query_lookback` with an error message containing the configured limit, which Grafana Cloud
// keeps in step with the tenant's retention period. The rejection is the answer we're after --
// the query never returns any data.
export function useLogsRetentionPeriod(): UseLogsRetentionPeriodResult {
  const logsDS = useLogsDS();

  const { data, isLoading } = useQuery({
    queryKey: ['logsRetention', logsDS?.uid],
    queryFn: () => fetchLogsRetentionFromLoki({ uid: logsDS!.uid, type: logsDS!.type }),
    enabled: Boolean(logsDS),
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
  });

  if (!data) {
    // while the canary query is in flight (or if it failed unexpectedly) fall back to the assumed values
    return { retentionPeriod: getFallbackRetentionPeriod(), isLoading };
  }

  return {
    retentionPeriod: data.type === 'known' ? data.periodMs : null,
    isLoading: false,
  };
}

export function getFallbackRetentionPeriod() {
  // @ts-expect-error - Cloud Free is not defined in the config but it is what is present for Free trial accounts and free tier accounts
  const isFree = config.buildInfo.edition === `Cloud Free`;
  const days = isFree ? FREE_TRIAL_RETENTION_DAYS : STANDARD_RETENTION_DAYS;

  return days * MILLISECONDS_IN_DAY;
}

async function fetchLogsRetentionFromLoki(datasource: { uid: string; type: string }): Promise<LogsRetention> {
  const end = Date.now() - CANARY_END_OFFSET;

  try {
    // the selector just needs to be syntactically valid -- the query frontend rejects
    // the query based on its time range before any log data is read
    await queryLoki({
      datasource,
      query: `{job=~".+"}`,
      start: end - CANARY_WINDOW,
      end,
      refId: REF_ID_LOGS_RETENTION_CANARY,
    });
  } catch (error) {
    const message = extractErrorMessage(error);

    if (message.includes(MAX_QUERY_LOOKBACK_ERROR)) {
      const periodMs = parseMaxQueryLookback(message);

      if (periodMs !== null) {
        return { type: 'known', periodMs };
      }
    }

    throw error;
  }

  return { type: 'unknown' };
}

// errors from /api/ds/query can surface the Loki error in the top-level message
// or nested in the per-refId results
export function extractErrorMessage(error: unknown): string {
  if (typeof error === 'string') {
    return error;
  }

  if (!error || typeof error !== 'object') {
    return '';
  }

  const { message, data } = error as {
    message?: string;
    data?: { message?: string; results?: Record<string, { error?: string }> };
  };
  const resultErrors = Object.values(data?.results ?? {}).map((result) => result?.error);

  return [message, data?.message, ...resultErrors].filter(Boolean).join('\n');
}

// e.g. "this data is no longer available, it is past now - max_query_lookback (2160h)"
export function parseMaxQueryLookback(message: string): number | null {
  const match = message.match(/max_query_lookback \(([^)]+)\)/);

  if (!match) {
    return null;
  }

  return parseGoDuration(match[1]);
}

const UNIT_TO_MS: Record<string, number> = {
  h: 60 * 60 * 1000,
  m: 60 * 1000,
  s: 1000,
  ms: 1,
};

// Loki reports the lookback limit in Go's duration format, e.g. "744h" or "2160h0m0s"
export function parseGoDuration(duration: string): number | null {
  const matches = [...duration.matchAll(/(\d+(?:\.\d+)?)(ms|h|m|s)/g)];

  if (matches.length === 0) {
    return null;
  }

  return matches.reduce((total, [, value, unit]) => total + Number(value) * UNIT_TO_MS[unit], 0);
}
