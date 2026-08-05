import { useQuery } from '@tanstack/react-query';
import { DataFrame, FieldType } from '@grafana/data';
import { parseLokiLogs } from 'features/parseLokiLogs/parseLokiLogs';
import { queryDS } from 'features/queryDatasources/queryDS';
import { queryLoki } from 'features/queryDatasources/queryLoki';

import { useLogsDS } from 'hooks/useLogsDS';
import {
  AppVersionChange,
  buildAppVersionHistoryLogQL,
  buildExceptionRealSessionsLogQL,
  buildFaroExecutionContextLogQL,
  buildRealUserExceptionsLogQL,
  buildRealUserHttpErrorsLogQL,
  buildRealUserPageLoadsLogQL,
  buildRealUserVitalP75LogQL,
  buildSimilarSessionsLogQL,
  FaroExecutionContext,
  getAppVersionChange,
  parseFaroExecutionContext,
  parseSimilarSessions,
  SimilarSession,
  WEB_VITALS,
  WebVitalName,
} from 'scenes/components/TimepointExplorer/FrontendContext.utils';

const REF_ID_FARO_EXECUTION_CONTEXT = 'faroExecutionContext';

interface UseFaroExecutionContextProps {
  executionId: string;
  from: number;
  to: number;
  enabled?: boolean;
}

export function useFaroExecutionContext({ executionId, from, to, enabled = true }: UseFaroExecutionContextProps) {
  const logsDS = useLogsDS();
  const canQuery = Boolean(logsDS && executionId && from && to && from < to && enabled);
  const expr = canQuery ? buildFaroExecutionContextLogQL(executionId) : '';

  return useQuery<FaroExecutionContext | null>({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps -- logsDS.uid is a stable identifier
    queryKey: ['faro-execution-context', logsDS?.uid, expr, from, to],
    queryFn: async () => {
      if (!logsDS) {
        return null;
      }

      try {
        const frames = await queryLoki<Record<string, string>, Record<string, string>>({
          datasource: logsDS,
          query: expr,
          start: from,
          end: to,
          refId: REF_ID_FARO_EXECUTION_CONTEXT,
        });

        const parsed = frames[0] ? parseLokiLogs(frames[0]) : [];

        return parseFaroExecutionContext(parsed);
      } catch {
        // Fail silently - Faro/FE O11y may not be available in this stack.
        return null;
      }
    },
    enabled: canQuery,
    staleTime: 60_000,
    retry: false,
    throwOnError: false,
  });
}

export interface RealUserPageBaseline {
  vitals: Partial<Record<WebVitalName, number>>;
  pageLoads: number | null;
  exceptions: number | null;
  httpErrors: number | null;
}

// How far back we look for the real-user baseline, ending at the execution's
// time window so the comparison reflects what users saw around the run.
const BASELINE_RANGE = '1h';
const BASELINE_RANGE_MS = 60 * 60 * 1000;

interface UseRealUserPageBaselineProps {
  appId: string;
  pageId: string;
  to: number;
  enabled?: boolean;
}

export function useRealUserPageBaseline({ appId, pageId, to, enabled = true }: UseRealUserPageBaselineProps) {
  const logsDS = useLogsDS();
  const canQuery = Boolean(logsDS && appId && pageId && to && enabled);

  return useQuery<RealUserPageBaseline | null>({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps -- logsDS.uid is a stable identifier
    queryKey: ['faro-page-baseline', logsDS?.uid, appId, pageId, to],
    queryFn: async () => {
      if (!logsDS) {
        return null;
      }

      const queryParams = { appId, pageId, range: BASELINE_RANGE };
      const instantQuery = {
        range: false,
        instant: true,
        queryType: 'instant',
        datasource: logsDS,
        maxDataPoints: 100,
        intervalMs: 20_000,
      };

      try {
        const results = await queryDS({
          queries: [
            ...WEB_VITALS.map((vital) => ({
              ...instantQuery,
              refId: `wv-${vital}`,
              expr: buildRealUserVitalP75LogQL({ ...queryParams, vital }),
            })),
            { ...instantQuery, refId: 'page-loads', expr: buildRealUserPageLoadsLogQL(queryParams) },
            { ...instantQuery, refId: 'exceptions', expr: buildRealUserExceptionsLogQL(queryParams) },
            { ...instantQuery, refId: 'http-errors', expr: buildRealUserHttpErrorsLogQL(queryParams) },
          ],
          start: to - BASELINE_RANGE_MS,
          end: to,
        });

        const vitals: Partial<Record<WebVitalName, number>> = {};

        WEB_VITALS.forEach((vital) => {
          const value = getInstantValue(results[`wv-${vital}`]);

          if (value !== null) {
            vitals[vital] = value;
          }
        });

        return {
          vitals,
          pageLoads: getInstantValue(results['page-loads']),
          exceptions: getInstantValue(results['exceptions']),
          httpErrors: getInstantValue(results['http-errors']),
        };
      } catch {
        // Fail silently - the panel simply won't show a baseline.
        return null;
      }
    },
    enabled: canQuery,
    staleTime: 60_000,
    retry: false,
    throwOnError: false,
  });
}

// Deploys are only useful context if they happened recently — look back far
// enough to catch a same-day release without scanning days of data.
const VERSION_LOOKBACK_MS = 6 * 60 * 60 * 1000;
const VERSION_BUCKET = '10m';

interface UseAppVersionChangeProps {
  appId: string;
  runVersion: string;
  to: number;
  enabled?: boolean;
}

export function useAppVersionChange({ appId, runVersion, to, enabled = true }: UseAppVersionChangeProps) {
  const logsDS = useLogsDS();
  const canQuery = Boolean(logsDS && appId && runVersion && to && enabled);

  return useQuery<AppVersionChange | null>({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps -- logsDS.uid is a stable identifier
    queryKey: ['faro-app-version-change', logsDS?.uid, appId, runVersion, to],
    queryFn: async () => {
      if (!logsDS) {
        return null;
      }

      try {
        const results = await queryDS({
          queries: [
            {
              refId: 'versions',
              expr: buildAppVersionHistoryLogQL({ appId, bucket: VERSION_BUCKET }),
              range: true,
              datasource: logsDS,
              intervalMs: 10 * 60 * 1000,
              maxDataPoints: 100,
            },
          ],
          start: to - VERSION_LOOKBACK_MS,
          end: to,
        });

        const series = (results['versions'] ?? []).map(getVersionActivity).filter(isNotNull);

        return getAppVersionChange(series, runVersion);
      } catch {
        // Fail silently - the panel simply won't show version context.
        return null;
      }
    },
    enabled: canQuery,
    staleTime: 60_000,
    retry: false,
    throwOnError: false,
  });
}

function getVersionActivity(frame: DataFrame): { version: string; firstSeen: number; lastSeen: number } | null {
  const timeField = frame.fields.find((f) => f.type === FieldType.time);
  const valueField = frame.fields.find((f) => f.type === FieldType.number);
  const version = valueField?.labels?.app_version;

  if (!timeField || !valueField || !version) {
    return null;
  }

  const activeTimes = timeField.values.filter((_, index) => {
    const value = valueField.values[index];
    return typeof value === 'number' && value > 0;
  });

  if (!activeTimes.length) {
    return null;
  }

  return { version, firstSeen: Math.min(...activeTimes), lastSeen: Math.max(...activeTimes) };
}

function isNotNull<T>(value: T | null): value is T {
  return value !== null;
}

const MAX_EXCEPTION_MATCHES = 3;

interface UseExceptionRealSessionsProps {
  appId: string;
  messages: string[];
  to: number;
  enabled?: boolean;
}

/**
 * For each of the run's exception messages, how many distinct real-user
 * sessions threw the same exception in the hour before the run.
 */
export function useExceptionRealSessions({ appId, messages, to, enabled = true }: UseExceptionRealSessionsProps) {
  const logsDS = useLogsDS();
  const uniqueMessages = [...new Set(messages)].slice(0, MAX_EXCEPTION_MATCHES);
  const canQuery = Boolean(logsDS && appId && uniqueMessages.length && to && enabled);

  return useQuery<Record<string, number> | null>({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps -- logsDS.uid is a stable identifier
    queryKey: ['faro-exception-real-sessions', logsDS?.uid, appId, uniqueMessages.join('|'), to],
    queryFn: async () => {
      if (!logsDS) {
        return null;
      }

      try {
        const results = await queryDS({
          queries: uniqueMessages.map((message, index) => ({
            refId: `exception-${index}`,
            expr: buildExceptionRealSessionsLogQL({ appId, message, range: BASELINE_RANGE }),
            range: false,
            instant: true,
            queryType: 'instant',
            datasource: logsDS,
            maxDataPoints: 100,
            intervalMs: 20_000,
          })),
          start: to - BASELINE_RANGE_MS,
          end: to,
        });

        return Object.fromEntries(
          uniqueMessages.map((message, index) => [message, getInstantValue(results[`exception-${index}`]) ?? 0])
        );
      } catch {
        // Fail silently - exceptions simply won't show real-user counts.
        return null;
      }
    },
    enabled: canQuery,
    staleTime: 60_000,
    retry: false,
    throwOnError: false,
  });
}

interface UseSimilarRealSessionsProps {
  appId: string;
  pageIds: string[];
  to: number;
  enabled?: boolean;
}

export function useSimilarRealSessions({ appId, pageIds, to, enabled = true }: UseSimilarRealSessionsProps) {
  const logsDS = useLogsDS();
  const canQuery = Boolean(logsDS && appId && pageIds.length && to && enabled);

  return useQuery<SimilarSession[] | null>({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps -- logsDS.uid is a stable identifier
    queryKey: ['faro-similar-sessions', logsDS?.uid, appId, pageIds.join(','), to],
    queryFn: async () => {
      if (!logsDS) {
        return null;
      }

      try {
        const frames = await queryLoki<Record<string, string>, Record<string, string>>({
          datasource: logsDS,
          query: buildSimilarSessionsLogQL({ appId, pageIds }),
          start: to - BASELINE_RANGE_MS,
          end: to,
          refId: 'faroSimilarSessions',
        });

        const parsed = frames[0] ? parseLokiLogs(frames[0]) : [];

        return parseSimilarSessions(parsed, pageIds);
      } catch {
        // Fail silently - the panel simply won't suggest similar sessions.
        return null;
      }
    },
    enabled: canQuery,
    staleTime: 60_000,
    retry: false,
    throwOnError: false,
  });
}

function getInstantValue(frames?: DataFrame[]): number | null {
  const field = frames?.[0]?.fields.find((f) => f.type === FieldType.number);
  const value = field?.values[field.values.length - 1];

  return typeof value === 'number' && !Number.isNaN(value) ? value : null;
}
