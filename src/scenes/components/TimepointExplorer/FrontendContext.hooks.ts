import { useCallback, useMemo } from 'react';
import { QueryObserverResult, useQueries, useQuery } from '@tanstack/react-query';
import { DataFrame, FieldType } from '@grafana/data';
import { getBackendSrv } from '@grafana/runtime';
import { parseLokiLogs } from 'features/parseLokiLogs/parseLokiLogs';
import { queryDS } from 'features/queryDatasources/queryDS';
import { queryLoki } from 'features/queryDatasources/queryLoki';
import { firstValueFrom } from 'rxjs';

import { Check, CheckType } from 'types';
import { getCheckType } from 'utils';
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
  formatBuild,
  getBuildActivity,
  getBuildChanges,
  getBuildStart,
  getFailureTrend,
  LabelledSeries,
  parseFaroRunContext,
  SourceMapUploads,
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
import { getFaroSessionFromLogs } from 'scenes/components/TimepointExplorer/TimepointViewerFaroSession.utils';

// "Real users right now" means the hour before the run.
export const REAL_USER_WINDOW = '1h';
export const REAL_USER_WINDOW_MS = 60 * 60 * 1000;

// Long enough to catch yesterday's deploy when a check starts failing the
// next morning, short enough to stay a cheap query.
export const BUILD_LOOKBACK_MS = 24 * 60 * 60 * 1000;
const BUILD_LOOKBACK_STEP_MS = 15 * 60 * 1000;
const FAILURE_TREND_STEP_MS = 30 * 60 * 1000;

const QUERY_DEFAULTS = {
  staleTime: 60_000,
  retry: false,
  throwOnError: false,
} as const;

function minutes(ms: number): string {
  return `${Math.round(ms / 60_000)}m`;
}

// Round to the step so a moving "now" doesn't produce a new query key on
// every render.
function floorTo(value: number, stepMs: number): number {
  return Math.floor(value / stepMs) * stepMs;
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
  from: number;
  to: number;
  enabled?: boolean;
}

export function useFaroRunContext({ executionId, from, to, enabled = true }: UseFaroRunContextProps) {
  const logsDS = useLogsDS();
  const canQuery = Boolean(logsDS && executionId && from && to && from < to && enabled);

  return useQuery<FaroRunContext | null>({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps -- logsDS.uid is a stable identifier
    queryKey: ['faro-run-context', logsDS?.uid, executionId, from, to],
    queryFn: async () => {
      if (!logsDS) {
        return null;
      }

      try {
        const frames = await queryLoki<Record<string, string>, Record<string, string>>({
          datasource: logsDS,
          query: buildFaroRunLogQL(executionId),
          start: from,
          end: to,
          refId: 'faroRunContext',
        });

        return parseFaroRunContext(frames[0] ? parseLokiLogs(frames[0]) : []);
      } catch {
        // Frontend Observability may not be set up on this stack.
        return null;
      }
    },
    enabled: canQuery,
    ...QUERY_DEFAULTS,
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
  from: number;
  to: number;
  stepMs: number;
  enabled?: boolean;
}

export function useAppBuildActivity({ appId, from, to, stepMs, enabled = true }: UseAppBuildActivityProps) {
  const logsDS = useLogsDS();
  const start = floorTo(from, stepMs);
  const end = ceilTo(to, stepMs);
  const canQuery = Boolean(logsDS && appId && start < end && enabled);

  return useQuery<BuildActivityResult | null>({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps -- logsDS.uid is a stable identifier
    queryKey: ['faro-build-activity', logsDS?.uid, appId, start, end, stepMs],
    queryFn: async () => {
      if (!logsDS || !appId) {
        return null;
      }

      try {
        const results = await queryDS({
          queries: [rangeQuery(logsDS, 'builds', buildBuildActivityLogQL({ appId, step: minutes(stepMs) }), stepMs)],
          start,
          end,
        });

        return { activity: getBuildActivity(framesToSeries(results.builds)), from: start, to: end, stepMs };
      } catch {
        return null;
      }
    },
    enabled: canQuery,
    ...QUERY_DEFAULTS,
  });
}

export function useRunBuildHistory({ appId, to }: { appId: string; to: number }) {
  return useAppBuildActivity({ appId, from: to - BUILD_LOOKBACK_MS, to, stepMs: BUILD_LOOKBACK_STEP_MS });
}

export function useRealUserBuildLoads({ appId, to }: { appId: string; to: number }) {
  const logsDS = useLogsDS();
  const canQuery = Boolean(logsDS && appId && to);

  return useQuery<LabelledSeries[] | null>({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps -- logsDS.uid is a stable identifier
    queryKey: ['faro-real-user-build-loads', logsDS?.uid, appId, to],
    queryFn: async () => {
      if (!logsDS) {
        return null;
      }

      try {
        const results = await queryDS({
          queries: [instantQuery(logsDS, 'loads', buildRealUserBuildLoadsLogQL({ appId, range: REAL_USER_WINDOW }))],
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
// Source-map uploads: when Frontend Observability first saw each build
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

export function useSourceMapUploads({ appId, bundleIds }: { appId?: string; bundleIds: Array<string | undefined> }) {
  const unique = [...new Set(bundleIds.filter((id): id is string => Boolean(id)))].sort();
  const uniqueKey = unique.join(',');

  const combine = useCallback(
    (results: Array<QueryObserverResult<number | null>>) => {
      const uploads: SourceMapUploads = {};

      uniqueKey.split(',').forEach((bundleId, index) => {
        const uploadedAt = results[index]?.data;

        if (bundleId && typeof uploadedAt === 'number') {
          uploads[bundleId] = uploadedAt;
        }
      });

      return { uploads, isLoading: results.some((result) => result.isLoading) };
    },
    [uniqueKey]
  );

  return useQueries({
    queries: unique.map((bundleId) => ({
      queryKey: ['faro-source-map-upload', appId, bundleId],
      queryFn: () => fetchSourceMapUpload(appId!, bundleId),
      enabled: Boolean(appId),
      // an upload time never changes, but a missing one can appear after a deploy
      staleTime: 10 * 60_000,
      retry: false,
    })),
    combine,
  });
}

// ---------------------------------------------------------------------------
// Blast radius
// ---------------------------------------------------------------------------

export interface FailureImpact {
  // distinct real-user sessions with the same failure in the hour before the run
  sessions: number;
  trend: FailureTrend;
  trendFrom: number;
  trendTo: number;
}

export function useFailureImpact({ appId, signature, to }: { appId: string; signature: FailureSignature; to: number }) {
  const logsDS = useLogsDS();
  const sessionsExpr = buildFailureSessionsLogQL({ appId, signature, range: REAL_USER_WINDOW });
  const trendExpr = buildFailureTrendLogQL({ appId, signature, step: minutes(FAILURE_TREND_STEP_MS) });
  const trendTo = ceilTo(to, FAILURE_TREND_STEP_MS);
  const trendFrom = trendTo - BUILD_LOOKBACK_MS;
  const canQuery = Boolean(logsDS && appId && to);

  return useQuery<FailureImpact | null>({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps -- logsDS.uid is a stable identifier
    queryKey: ['faro-failure-impact', logsDS?.uid, sessionsExpr, to],
    queryFn: async () => {
      if (!logsDS) {
        return null;
      }

      try {
        const [sessions, trend] = await Promise.all([
          queryDS({
            queries: [instantQuery(logsDS, 'sessions', sessionsExpr)],
            start: to - REAL_USER_WINDOW_MS,
            end: to,
          }),
          queryDS({
            queries: [rangeQuery(logsDS, 'trend', trendExpr, FAILURE_TREND_STEP_MS)],
            start: trendFrom,
            end: trendTo,
          }),
        ]);

        const trendPoints = framesToSeries(trend.trend)[0]?.points ?? [];

        return {
          sessions: framesToSeries(sessions.sessions)[0]?.points.at(-1)?.[1] ?? 0,
          trend: getFailureTrend(trendPoints, trendFrom, trendTo, FAILURE_TREND_STEP_MS),
          trendFrom,
          trendTo,
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

export function useJourneySessions({ appId, pageIds, to }: { appId: string; pageIds: string[]; to: number }) {
  const logsDS = useLogsDS();
  const canQuery = Boolean(logsDS && appId && pageIds.length && to);

  return useQuery<JourneySessions | null>({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps -- logsDS.uid is a stable identifier
    queryKey: ['faro-journey-sessions', logsDS?.uid, appId, pageIds.join('\n'), to],
    queryFn: async () => {
      if (!logsDS) {
        return null;
      }

      try {
        const params = { appId, pageIds, range: REAL_USER_WINDOW };
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
  from: number;
  to: number;
}

function getLatestExecution(listLogsMap: Record<UnixTimestamp, StatefulTimepoint>): LatestExecution | null {
  const timepoints = Object.values(listLogsMap).sort((a, b) => b.adjustedTime - a.adjustedTime);

  for (const timepoint of timepoints) {
    for (const executions of Object.values(timepoint.probeResults)) {
      const executionId = executions.find((execution) => execution.labels.execution_id)?.labels.execution_id;

      if (executionId) {
        return {
          executionId,
          from: timepoint.adjustedTime,
          to: timepoint.adjustedTime + timepoint.timepointDuration + timepoint.config.frequency,
        };
      }
    }
  }

  return null;
}

/**
 * The Faro app a browser check exercises, found from one of its recent runs.
 * Cached per check: the app a check targets doesn't change between runs.
 */
function useCheckFaroAppId(check: Check, listLogsMap: Record<UnixTimestamp, StatefulTimepoint>) {
  const logsDS = useLogsDS();
  const isBrowserCheck = getCheckType(check.settings) === CheckType.Browser;
  const latest = useMemo(() => getLatestExecution(listLogsMap), [listLogsMap]);

  return useQuery<string | null>({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps -- resolved once per check, any run will do
    queryKey: ['faro-check-app-id', logsDS?.uid, check.id],
    queryFn: async () => {
      if (!logsDS || !latest) {
        return null;
      }

      try {
        const frames = await queryLoki<Record<string, string>, Record<string, string>>({
          datasource: logsDS,
          query: buildFaroRunLogQL(latest.executionId),
          start: latest.from,
          end: latest.to,
          refId: 'faroCheckApp',
        });

        return getFaroSessionFromLogs(frames[0] ? parseLokiLogs(frames[0]) : [])?.appId ?? null;
      } catch {
        return null;
      }
    },
    enabled: Boolean(isBrowserCheck && logsDS && latest),
    staleTime: 10 * 60_000,
    retry: false,
    throwOnError: false,
  });
}

// Keep the explorer's build query to a few hundred buckets whatever the
// selected range.
function getExplorerBuildStep(from: number, to: number): number {
  const fiveMinutes = 5 * 60_000;

  return Math.max(fiveMinutes, ceilTo((to - from) / 300, fiveMinutes));
}

export function formatBuildChangeDescription(build: AppBuild, previous?: AppBuild): string {
  return previous ? `${formatBuild(build)} (was ${formatBuild(previous)})` : formatBuild(build);
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
  const { data: appId } = useCheckFaroAppId(check, listLogsMap);
  const stepMs = getExplorerBuildStep(from, to);
  const { data } = useAppBuildActivity({ appId: appId ?? undefined, from, to, stepMs, enabled: Boolean(appId) });
  const changes = useMemo(() => (data ? getBuildChanges(data.activity) : []), [data]);
  const { uploads } = useSourceMapUploads({
    appId: appId ?? undefined,
    bundleIds: changes.map((change) => change.build.bundleId),
  });

  return useMemo(() => {
    if (!data) {
      return [];
    }

    return changes.map<CheckEvent>((change) => {
      const start = getBuildStart({
        firstSeen: change.time,
        stepMs: data.stepMs,
        uploadedAt: change.build.bundleId ? uploads[change.build.bundleId] : undefined,
      });
      const description = formatBuildChangeDescription(change.build, change.previous);

      return {
        label: CheckEventType.AppBuildChanged,
        // Without an upload time, mark the earliest moment the build could
        // have gone live, so a failure it caused never lands before it.
        from: start.from,
        to: start.from,
        color: ANNOTATION_COLOR_APP_BUILD,
        description: start.source === 'source-maps' ? description : `${description} · approximate time`,
      };
    });
  }, [changes, data, uploads]);
}
