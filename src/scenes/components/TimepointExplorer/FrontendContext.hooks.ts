import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DataFrame, FieldType } from '@grafana/data';
import { getBackendSrv } from '@grafana/runtime';
import { parseLokiLogs } from 'features/parseLokiLogs/parseLokiLogs';
import { queryDS } from 'features/queryDatasources/queryDS';
import { LOKI_LOG_LIMIT, queryLoki } from 'features/queryDatasources/queryLoki';
import { firstValueFrom } from 'rxjs';

import { Check, CheckType } from 'types';
import { getCheckType } from 'utils';
import { ONE_HOUR_IN_MS, ONE_MINUTE_IN_MS, ONE_SECOND_IN_MS } from 'utils.constants';
import { useLogsDS } from 'hooks/useLogsDS';
import {
  AppBuild,
  BuildActivity,
  buildBuildActivityLogQL,
  buildFailureSessionsLogQL,
  buildFailureTrendLogQL,
  buildFaroRunLogQL,
  buildJourneyErrorSessionsLogQL,
  buildJourneySessionsLogQL,
  buildRealUserBuildLoadsLogQL,
  FailureSignature,
  FailureTrend,
  FaroRunContext,
  FaroScope,
  formatBuild,
  getBuildActivity,
  getBuildChanges,
  getBuildStart,
  getFailureTrend,
  LabelledSeries,
  parseFaroRunContext,
} from 'scenes/components/TimepointExplorer/FrontendContext.utils';
import {
  ANNOTATION_COLOR_APP_BUILD,
  FARO_APP_PLUGIN_ID,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.constants';
import {
  CheckEvent,
  CheckEventType,
  StatefulTimepoint,
  UnixTimestamp,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.types';

// "Real users right now" means the hour before the run.
export const REAL_USER_WINDOW = '1h';
export const REAL_USER_WINDOW_MS = ONE_HOUR_IN_MS;

// Long enough to catch yesterday's deploy when a check starts failing the
// next morning, short enough to stay a cheap query.
export const BUILD_LOOKBACK_MS = 24 * ONE_HOUR_IN_MS;
const BUILD_LOOKBACK_STEP_MS = 15 * ONE_MINUTE_IN_MS;
const FAILURE_TREND_STEP_MS = 30 * ONE_MINUTE_IN_MS;

const QUERY_DEFAULTS = {
  staleTime: ONE_MINUTE_IN_MS,
  retry: false,
  throwOnError: false,
} as const;

function minutes(ms: number): string {
  return `${Math.round(ms / ONE_MINUTE_IN_MS)}m`;
}

function ceilTo(value: number, stepMs: number): number {
  return Math.ceil(value / stepMs) * stepMs;
}

function framesToSeries(frames: DataFrame[] = []): LabelledSeries[] {
  return frames.flatMap((frame) => {
    const timeField = frame.fields.find((field) => field.type === FieldType.time);
    const valueField = frame.fields.find((field) => field.type === FieldType.number);

    if (!timeField || !valueField) {
      return [];
    }

    return [
      {
        labels: valueField.labels ?? {},
        points: timeField.values.map((time, index) => [Number(time), Number(valueField.values[index])]),
      },
    ];
  });
}

function seriesToRecord(series: LabelledSeries[], label: string): Record<string, number> {
  return Object.fromEntries(series.map(({ labels, points }) => [labels[label] ?? '', points.at(-1)?.[1] ?? 0]));
}

function instantQuery(datasource: { uid: string; type: string }, refId: string, expr: string) {
  return { refId, expr, datasource, range: false, instant: true, queryType: 'instant', maxDataPoints: 1 };
}

function rangeQuery(datasource: { uid: string; type: string }, refId: string, expr: string, stepMs: number) {
  return {
    refId,
    expr,
    datasource,
    range: true,
    queryType: 'range',
    step: minutes(stepMs),
    intervalMs: stepMs,
    maxDataPoints: 1000,
  };
}

// ---------------------------------------------------------------------------
// The run's own session
// ---------------------------------------------------------------------------

interface UseFaroRunContextProps {
  executionId: string;
  executionTime: number;
  from: number;
  to: number;
  enabled?: boolean;
}

export function useFaroRunContext({ executionId, executionTime, from, to, enabled = true }: UseFaroRunContextProps) {
  const logsDS = useLogsDS();
  const canQuery = Boolean(logsDS && executionId && from && to && from < to && enabled);

  return useQuery<FaroRunContext | null>({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps -- logsDS.uid is a stable identifier
    queryKey: ['faro-run-context', logsDS?.uid, executionId, from, to],
    queryFn: async () => {
      if (!logsDS) {
        return null;
      }

      const frames = await queryLoki<Record<string, string>, Record<string, string>>({
        datasource: logsDS,
        query: buildFaroRunLogQL(executionId),
        start: from,
        end: to,
        refId: 'faroRunContext',
      });
      const records = frames.flatMap((frame) => parseLokiLogs(frame));
      const run = parseFaroRunContext(records);

      return run ? { ...run, isTruncated: records.length >= LOKI_LOG_LIMIT } : null;
    },
    enabled: canQuery,
    ...QUERY_DEFAULTS,
    // Retry discovery while telemetry for a recent execution is still arriving.
    refetchInterval: (query) =>
      !query.state.data && Date.now() - executionTime < 5 * ONE_MINUTE_IN_MS ? 5 * ONE_SECOND_IN_MS : false,
  });
}

// ---------------------------------------------------------------------------
// Build history
// ---------------------------------------------------------------------------

export interface BuildActivityResult {
  activity: BuildActivity[];
  from: number;
  to: number;
  stepMs: number;
}

interface UseAppBuildActivityProps {
  appId?: string;
  appEnvironment?: string;
  from: number;
  to: number;
  stepMs: number;
  enabled?: boolean;
}

export function useAppBuildActivity({
  appId,
  appEnvironment,
  from,
  to,
  stepMs,
  enabled = true,
}: UseAppBuildActivityProps) {
  const logsDS = useLogsDS();
  const canQuery = Boolean(logsDS && appId && from < to && enabled);

  return useQuery<BuildActivityResult | null>({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps -- logsDS.uid is a stable identifier
    queryKey: ['faro-build-activity', logsDS?.uid, appId, appEnvironment, from, to, stepMs],
    queryFn: async () => {
      if (!logsDS || !appId) {
        return null;
      }

      try {
        const results = await queryDS({
          queries: [
            rangeQuery(
              logsDS,
              'builds',
              buildBuildActivityLogQL({ appId, appEnvironment, step: minutes(stepMs) }),
              stepMs
            ),
          ],
          start: from,
          end: to,
        });

        const series = framesToSeries(results.builds).map((series) => ({
          ...series,
          points: series.points.filter(([time]) => time > from && time <= to),
        }));
        return { activity: getBuildActivity(series), from, to, stepMs };
      } catch {
        return null;
      }
    },
    enabled: canQuery,
    ...QUERY_DEFAULTS,
  });
}

export function useRunBuildHistory({ to, ...scope }: FaroScope & { to: number; enabled?: boolean }) {
  return useAppBuildActivity({ ...scope, from: to - BUILD_LOOKBACK_MS, to, stepMs: BUILD_LOOKBACK_STEP_MS });
}

export function useRealUserBuildLoads({
  appId,
  appEnvironment,
  to,
  enabled = true,
}: FaroScope & { to: number; enabled?: boolean }) {
  const logsDS = useLogsDS();
  const canQuery = Boolean(logsDS && appId && to && enabled);

  return useQuery<LabelledSeries[] | null>({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps -- logsDS.uid is a stable identifier
    queryKey: ['faro-real-user-build-loads', logsDS?.uid, appId, appEnvironment, to],
    queryFn: async () => {
      if (!logsDS) {
        return null;
      }

      try {
        const results = await queryDS({
          queries: [
            instantQuery(
              logsDS,
              'loads',
              buildRealUserBuildLoadsLogQL({ appId, appEnvironment, range: REAL_USER_WINDOW })
            ),
          ],
          start: to - REAL_USER_WINDOW_MS,
          end: to,
        });

        return framesToSeries(results.loads);
      } catch {
        return null;
      }
    },
    enabled: canQuery,
    ...QUERY_DEFAULTS,
  });
}

// ---------------------------------------------------------------------------
// Source-map upload metadata for the run's build
// ---------------------------------------------------------------------------

interface SourceMapListResponse {
  bundles?: Array<{ ID: string; Created: string }>;
}

async function fetchSourceMapUpload(appId: string, bundleId: string): Promise<number | null> {
  try {
    // The list is oldest first and paginated; filtering by bundle id is the
    // only way to reach one build without walking every page.
    const response = await firstValueFrom(
      getBackendSrv().fetch<SourceMapListResponse>({
        url: `/api/plugin-proxy/${FARO_APP_PLUGIN_ID}/api-proxy/api/v1/app/${encodeURIComponent(appId)}/sourcemaps`,
        method: 'GET',
        params: { filter: bundleId, limit: 5 },
        showErrorAlert: false,
        showSuccessAlert: false,
      })
    );
    const created = response.data.bundles?.find((bundle) => bundle.ID === bundleId)?.Created;
    const time = created ? Date.parse(created) : NaN;

    return Number.isNaN(time) ? null : time;
  } catch {
    // No source maps for this build, or no access to Frontend Observability's API.
    return null;
  }
}

export function useSourceMapUpload({ appId, bundleId }: { appId: string; bundleId?: string }) {
  return useQuery({
    queryKey: ['faro-source-map-upload', appId, bundleId],
    queryFn: () => (bundleId ? fetchSourceMapUpload(appId, bundleId) : null),
    enabled: Boolean(bundleId),
    // An upload time never changes, but a missing one can appear after a deploy.
    staleTime: 10 * ONE_MINUTE_IN_MS,
    retry: false,
  });
}

// ---------------------------------------------------------------------------
// Blast radius
// ---------------------------------------------------------------------------

export interface FailureImpact {
  // distinct real-user sessions with the same failure in the hour before the run
  sessions: number;
  trend: FailureTrend;
}

export function useFailureImpact({
  appId,
  appEnvironment,
  signature,
  to,
}: FaroScope & { signature: FailureSignature; to: number }) {
  const logsDS = useLogsDS();
  const sessionsExpr = buildFailureSessionsLogQL({ appId, appEnvironment, signature, range: REAL_USER_WINDOW });
  const trendExpr = buildFailureTrendLogQL({ appId, appEnvironment, signature, step: minutes(FAILURE_TREND_STEP_MS) });
  const trendFrom = to - BUILD_LOOKBACK_MS;
  const canQuery = Boolean(logsDS && appId && to);

  return useQuery<FailureImpact | null>({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps -- logsDS.uid is a stable identifier
    queryKey: ['faro-failure-impact', logsDS?.uid, sessionsExpr, trendExpr, to],
    queryFn: async () => {
      if (!logsDS) {
        return null;
      }

      try {
        const results = await queryDS({
          queries: [
            instantQuery(logsDS, 'sessions', sessionsExpr),
            rangeQuery(logsDS, 'trend', trendExpr, FAILURE_TREND_STEP_MS),
          ],
          start: trendFrom,
          end: to,
        });

        const trendPoints = framesToSeries(results.trend)[0]?.points ?? [];

        return {
          sessions: framesToSeries(results.sessions)[0]?.points.at(-1)?.[1] ?? 0,
          trend: getFailureTrend(trendPoints, trendFrom, to, FAILURE_TREND_STEP_MS),
        };
      } catch {
        return null;
      }
    },
    enabled: canQuery,
    ...QUERY_DEFAULTS,
  });
}

// ---------------------------------------------------------------------------
// Real users on the run's journey
// ---------------------------------------------------------------------------

export interface JourneySessions {
  sessionsByPage: Record<string, number>;
  errorSessionsByPage: Record<string, number>;
}

export function useJourneySessions({
  appId,
  appEnvironment,
  pageIds,
  to,
}: FaroScope & { pageIds: string[]; to: number }) {
  const logsDS = useLogsDS();
  const canQuery = Boolean(logsDS && appId && pageIds.length && to);

  return useQuery<JourneySessions | null>({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps -- logsDS.uid is a stable identifier
    queryKey: ['faro-journey-sessions', logsDS?.uid, appId, appEnvironment, pageIds, to],
    queryFn: async () => {
      if (!logsDS) {
        return null;
      }

      try {
        const params = { appId, appEnvironment, pageIds, range: REAL_USER_WINDOW };
        const results = await queryDS({
          queries: [
            instantQuery(logsDS, 'visits', buildJourneySessionsLogQL(params)),
            instantQuery(logsDS, 'errors', buildJourneyErrorSessionsLogQL(params)),
          ],
          start: to - REAL_USER_WINDOW_MS,
          end: to,
        });

        return {
          sessionsByPage: seriesToRecord(framesToSeries(results.visits), 'page_id'),
          errorSessionsByPage: seriesToRecord(framesToSeries(results.errors), 'page_id'),
        };
      } catch {
        return null;
      }
    },
    enabled: canQuery,
    ...QUERY_DEFAULTS,
  });
}

// ---------------------------------------------------------------------------
// Explorer annotations: new app builds on the check's timeline
// ---------------------------------------------------------------------------

interface LatestExecution {
  executionId: string;
  executionTime: number;
  from: number;
  to: number;
}

function getLatestExecution(listLogsMap: Record<UnixTimestamp, StatefulTimepoint>): LatestExecution | null {
  const timepoints = Object.values(listLogsMap).sort((a, b) => b.adjustedTime - a.adjustedTime);

  for (const timepoint of timepoints) {
    const execution = Object.values(timepoint.probeResults)
      .flat()
      .sort((a, b) => b.timestamp - a.timestamp)
      .find((execution) => execution.labels.execution_id);

    if (execution?.labels.execution_id) {
      return {
        executionId: execution.labels.execution_id,
        executionTime: execution.timestamp,
        from: timepoint.adjustedTime,
        to: timepoint.adjustedTime + timepoint.timepointDuration + timepoint.config.frequency,
      };
    }
  }

  return null;
}

// Keep the explorer's build query to a few hundred buckets whatever the
// selected range.
function getExplorerBuildStep(from: number, to: number): number {
  const fiveMinutes = 5 * ONE_MINUTE_IN_MS;

  return Math.max(fiveMinutes, ceilTo((to - from) / 300, fiveMinutes));
}

export function formatBuildChangeDescription(build: AppBuild, previous?: AppBuild): string {
  return previous ? `${formatBuild(build)} (also observed: ${formatBuild(previous)})` : formatBuild(build);
}

export function useAppBuildChangeEvents({
  check,
  listLogsMap,
  from,
  to,
}: {
  check: Check;
  listLogsMap: Record<UnixTimestamp, StatefulTimepoint>;
  from: UnixTimestamp;
  to: UnixTimestamp;
}): CheckEvent[] {
  const latest = useMemo(() => getLatestExecution(listLogsMap), [listLogsMap]);
  const { data: run } = useFaroRunContext({
    executionId: latest?.executionId ?? '',
    executionTime: latest?.executionTime ?? 0,
    from: latest?.from ?? 0,
    to: latest?.to ?? 0,
    enabled: getCheckType(check.settings) === CheckType.Browser && Boolean(latest),
  });
  const stepMs = getExplorerBuildStep(from, to);
  const { data } = useAppBuildActivity({
    appId: run?.appId,
    appEnvironment: run?.appEnvironment,
    from,
    to,
    stepMs,
    enabled: Boolean(run),
  });
  return useMemo(() => {
    if (!data) {
      return [];
    }

    return getBuildChanges(data.activity, data.from, data.stepMs).map<CheckEvent>((change) => {
      const start = getBuildStart({
        firstSeen: change.time,
        stepMs: data.stepMs,
      });
      const description = formatBuildChangeDescription(change.build, change.previous);

      return {
        label: CheckEventType.AppBuildChanged,
        // Page loads establish an observation interval, not a deployment time.
        from: start.from,
        to: start.from,
        color: ANNOTATION_COLOR_APP_BUILD,
        description: `${description} · approximate first observation${run?.appEnvironment ? ` · ${run.appEnvironment}` : ' · all environments'}`,
      };
    });
  }, [data, run?.appEnvironment]);
}
