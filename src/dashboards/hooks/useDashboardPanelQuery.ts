import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DataTransformContext, FieldConfigSource, LoadingState, PanelData } from '@grafana/data';
import { getDataSourceSrv } from '@grafana/runtime';
import { buildPanelMenu, PanelMenuDefinition } from 'dashboards/components/buildPanelMenu';
import { applyTransforms, DashboardTransformDefinition } from 'dashboards/query/applyTransforms';
import { buildDatasourceRequests } from 'dashboards/query/buildRequests';
import { registerActiveDashboardScope } from 'dashboards/query/dashboardQueryInvalidation';
import { buildDashboardQueryKey, createDashboardQueryScope } from 'dashboards/query/dashboardQueryKeys';
import { createDashboardQueryOptions } from 'dashboards/query/dashboardQueryOptions';
import { executeQueries } from 'dashboards/query/executeQueries';
import { interpolateTargets } from 'dashboards/query/interpolate';
import { toPanelData } from 'dashboards/query/toPanelData';

import { DashboardQueryTarget, ExecuteQueriesResult } from 'dashboards/query/types';
import { useAppTime } from 'contexts/AppTimeProvider';
import { useCheckDashboard } from 'contexts/CheckDashboardProvider';
import { useSMDatasourceContext } from 'contexts/SMDatasourceContext';
import { useLogsDS } from 'hooks/useLogsDS';
import { useMetricsDS } from 'hooks/useMetricsDS';

import { DashboardQueryRange } from './dashboardQueryTime';
import { useDashboardQuerySemanticValues, useDashboardTimeRange } from './useDashboardQuerySemanticValues';

export type DashboardPanelDefinition = {
  id: string;
  pluginId: string;
  fieldConfig: FieldConfigSource;
  options: Record<string, unknown>;
  targets: DashboardQueryTarget[];
  transforms?: DashboardTransformDefinition[];
  maxDataPoints?: number;
  description?: string;
  title?: string;
  datasourceType?: 'prometheus' | 'loki';
};

export function useDashboardPanelQuery(
  definition: DashboardPanelDefinition,
  options: {
    range?: DashboardQueryRange;
    enabled?: boolean;
  } = {}
) {
  const { check } = useCheckDashboard();
  const { smDS } = useSMDatasourceContext();
  const metricsDS = useMetricsDS();
  const logsDS = useLogsDS();
  const activeDS = definition.datasourceType === 'loki' ? logsDS : metricsDS;
  const timeRange = useDashboardTimeRange(options.range);
  const { timezone } = useAppTime();
  const semanticValues = useDashboardQuerySemanticValues(definition.maxDataPoints ?? 500, options.range);
  const stackId = String((smDS.meta.jsonData as { stackId?: number } | undefined)?.stackId ?? '0');
  const scope = useMemo(() => createDashboardQueryScope(stackId, check.id!), [check.id, stackId]);

  useEffect(() => {
    return registerActiveDashboardScope(scope);
  }, [scope]);

  const datasourceType = definition.datasourceType === 'loki' ? 'loki' : 'prometheus';

  const interpolatedTargets = useMemo(
    () =>
      interpolateTargets(definition.targets, semanticValues).map((target) => ({
        ...target,
        datasource: target.datasource ?? { uid: activeDS?.uid, type: datasourceType },
      })),
    [activeDS?.uid, datasourceType, definition.targets, semanticValues]
  );

  const requests = useMemo(
    () =>
      buildDatasourceRequests({
        targets: interpolatedTargets,
        range: {
          from: timeRange.from.valueOf(),
          to: timeRange.to.valueOf(),
        },
        timezone,
        interval: semanticValues.interval,
        intervalMs: semanticValues.intervalMs,
        maxDataPoints: definition.maxDataPoints ?? 500,
        requestId: definition.id,
        defaultDatasource: {
          uid: activeDS?.uid ?? '',
          type: datasourceType,
        },
      }),
    [
      activeDS?.uid,
      datasourceType,
      definition.id,
      definition.maxDataPoints,
      interpolatedTargets,
      semanticValues.interval,
      semanticValues.intervalMs,
      timeRange,
      timezone,
    ]
  );

  const queryKey = useMemo(
    () =>
      buildDashboardQueryKey({
        scope,
        request: requests[0] ?? {
          datasourceUid: activeDS?.uid ?? '',
          datasourceType,
          targets: interpolatedTargets,
          range: { from: timeRange.from.valueOf(), to: timeRange.to.valueOf() },
          timezone,
          interval: semanticValues.interval,
          intervalMs: semanticValues.intervalMs,
          maxDataPoints: definition.maxDataPoints ?? 500,
          requestId: definition.id,
        },
      }),
    [
      activeDS?.uid,
      datasourceType,
      definition.id,
      definition.maxDataPoints,
      interpolatedTargets,
      requests,
      scope,
      semanticValues,
      timeRange,
      timezone,
    ]
  );

  const query = useQuery<ExecuteQueriesResult>(
    createDashboardQueryOptions({
      scope,
      queryKey: [definition.id, queryKey, requests],
      queryFn: async ({ signal }) =>
        executeQueries({
          requests,
          signal,
          getDataSource: (uid) => getDataSourceSrv().get(uid),
        }),
      enabled: options.enabled !== false && Boolean(activeDS?.uid) && requests.length > 0,
    })
  );

  const rawFrames = useMemo(
    () => query.data?.results.flatMap((result) => result.frames) ?? [],
    [query.data]
  );
  const [transformResult, setTransformResult] = useState<{
    source: ExecuteQueriesResult;
    transforms: DashboardTransformDefinition[];
    frames: PanelData['series'];
  } | null>(null);
  const transformContext = useMemo<DataTransformContext>(
    () => ({
      interpolate: (value: string) => value,
    }),
    []
  );

  useEffect(() => {
    if (!definition.transforms?.length || !query.data) {
      return;
    }

    const source = query.data;
    const transforms = definition.transforms;
    const subscription = applyTransforms(rawFrames, transforms, transformContext).subscribe(
      (frames) => {
        setTransformResult({ source, transforms, frames });
      }
    );

    return () => subscription.unsubscribe();
  }, [definition.transforms, query.data, rawFrames, transformContext]);

  const transformsPending =
    Boolean(definition.transforms?.length) &&
    Boolean(query.data) &&
    (transformResult?.source !== query.data ||
      transformResult?.transforms !== definition.transforms);
  const currentFrames = useMemo(
    () =>
      definition.transforms?.length
        ? transformsPending
          ? []
          : transformResult?.frames ?? []
        : rawFrames,
    [definition.transforms, rawFrames, transformResult?.frames, transformsPending]
  );

  const panelData = useMemo<PanelData>(() => {
    if (options.enabled === false && !query.data) {
      return {
        state: LoadingState.Done,
        series: [],
        timeRange,
      };
    }

    if (query.isPending && !query.data) {
      return {
        state: LoadingState.Loading,
        series: [],
        timeRange,
      };
    }

    if (query.isError) {
      return {
        state: LoadingState.Error,
        series: [],
        error: query.error instanceof Error ? query.error : new Error('Dashboard query failed'),
        timeRange,
      };
    }

    const results =
      query.data?.results.map((result) => ({
        ...result,
        frames: currentFrames,
      })) ?? [];

    if (results.length === 0) {
      return {
        state: LoadingState.Loading,
        series: [],
        timeRange,
      };
    }

    const data = toPanelData(results, timeRange);

    if (query.isFetching && data.state === LoadingState.Done) {
      return {
        ...data,
        state: LoadingState.Loading,
      };
    }

    return data;
  }, [
    options.enabled,
    query.data,
    query.error,
    query.isError,
    query.isFetching,
    query.isPending,
    timeRange,
    currentFrames,
  ]);

  const menuDefinition: PanelMenuDefinition = useMemo(
    () => ({
      pluginId: definition.pluginId,
      fieldConfig: definition.fieldConfig as unknown as Record<string, unknown>,
      options: definition.options,
      targets: interpolatedTargets,
      datasourceUid: activeDS?.uid,
    }),
    [activeDS?.uid, definition.fieldConfig, definition.options, definition.pluginId, interpolatedTargets]
  );

  const menuItems = useMemo(
    () =>
      activeDS?.uid
        ? buildPanelMenu({
            definition: menuDefinition,
            timeRange,
            datasourceUid: activeDS.uid,
          })
        : undefined,
    [activeDS?.uid, menuDefinition, timeRange]
  );

  const title = useMemo(() => {
    if (!definition.title) {
      return definition.title;
    }

    return interpolateTargets([{ refId: 'title', expr: definition.title }], semanticValues)[0]?.expr;
  }, [definition.title, semanticValues]);

  return {
    panelData,
    menuItems,
    title,
    isLoading:
      options.enabled !== false &&
      (query.isPending || query.isFetching || transformsPending),
  };
}
