import {
  AnnotationEvent,
  AnnotationQuery,
  arrayToDataFrame,
  CoreApp,
  DataFrame,
  DataQueryRequest,
  DataSourceApi,
  DataTopic,
  dateTime,
  LoadingState,
  PanelData,
  rangeUtil,
  TimeRange,
} from '@grafana/data';
import { getDataSourceSrv, getRunRequest, getTemplateSrv } from '@grafana/runtime';
import { filter, firstValueFrom, Observable } from 'rxjs';

import { dedupAnnotationEvents, postProcessAnnotationEvents } from './annotationQueryUtils';

const LEGACY_ANNOTATION_RUNNER_TYPES = new Set([
  'prometheus',
  'loki',
  'elasticsearch',
  'grafana-opensearch-datasource',
]);

function interpolateAnnotationExpr(expr: string, job: string, instance: string): string {
  return expr.replaceAll('$job', job).replaceAll('$instance', instance);
}

function shouldUseLegacyAnnotationRunner(datasource: DataSourceApi): boolean {
  // Legacy annotationQuery remains as a fallback for older datasource plugins.
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  return Boolean(datasource.annotationQuery && LEGACY_ANNOTATION_RUNNER_TYPES.has(datasource.type));
}

function annotationEventsToFrame(events: AnnotationEvent[]): DataFrame {
  const frame = arrayToDataFrame(events);

  return {
    ...frame,
    meta: {
      ...frame.meta,
      dataTopic: DataTopic.Annotations,
    },
  };
}

function markAnnotationFrames(frames: DataFrame[]): DataFrame[] {
  return frames.map((frame) => ({
    ...frame,
    meta: {
      ...frame.meta,
      dataTopic: frame.meta?.dataTopic ?? DataTopic.Annotations,
    },
  }));
}

async function executeLegacyAnnotationQuery(options: {
  datasource: DataSourceApi;
  annotation: AnnotationQuery;
  timeRange: TimeRange;
}): Promise<AnnotationEvent[]> {
  const { datasource, annotation, timeRange } = options;

  // eslint-disable-next-line @typescript-eslint/no-deprecated
  if (!datasource.annotationQuery) {
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-deprecated
  const events = await datasource.annotationQuery({
    range: timeRange,
    rangeRaw: timeRange.raw,
    annotation,
    dashboard: {
      getVariables: getTemplateSrv().getVariables,
    },
  });

  return events ?? [];
}

async function executeModernAnnotationQuery(options: {
  datasource: DataSourceApi;
  annotation: AnnotationQuery;
  timeRange: TimeRange;
  timezone: string;
}): Promise<DataFrame[]> {
  const { datasource, annotation, timeRange, timezone } = options;

  // Query with the same top-level annotation shape the Scene AnnotationLayer used.
  // Client-side coalescing in annotationFramesToEvents turns prometheus step
  // samples into regions; we intentionally do not call AnnotationSupport.processEvents
  // here because it can return empty/non-emitting results for this query shape.
  const request: DataQueryRequest = {
    app: CoreApp.Dashboard,
    requestId: `dashboard-annotation-${annotation.name}`,
    timezone,
    range: timeRange,
    timeInfo: '',
    interval: rangeUtil.calculateInterval(timeRange, 500, '1s').interval,
    intervalMs: rangeUtil.calculateInterval(timeRange, 500, '1s').intervalMs,
    maxDataPoints: 500,
    scopedVars: {},
    startTime: dateTime().valueOf(),
    targets: [
      {
        ...annotation,
        refId: 'Anno',
      },
    ],
  };

  const runRequest = getRunRequest();
  // runRequest emits Loading (often empty) before Done — firstValueFrom alone
  // would resolve too early and drop alert regions until a later refresh.
  const panelData = await firstValueFrom(waitForSettledPanelData(runRequest(datasource, request)));

  // Prefer annotation-topic frames when present; fall back to series for datasources
  // that still return raw prometheus samples via runRequest.
  const frames = panelData.annotations?.length
    ? panelData.annotations
    : panelData.series?.length
      ? panelData.series
      : [];

  return markAnnotationFrames(frames);
}

/** Exported for tests — wait until runRequest leaves the initial Loading state. */
export function waitForSettledPanelData(panelData$: Observable<PanelData>): Observable<PanelData> {
  return panelData$.pipe(
    filter((data) => data.state === LoadingState.Done || data.state === LoadingState.Error)
  );
}

export async function executeDashboardAnnotationQuery(options: {
  annotation: AnnotationQuery;
  timeRange: TimeRange;
  timezone: string;
  job: string;
  instance: string;
  signal?: AbortSignal;
}): Promise<DataFrame[]> {
  const { annotation, timeRange, timezone, job, instance, signal } = options;
  const datasourceRef = annotation.datasource;

  if (!datasourceRef?.uid || signal?.aborted) {
    return [];
  }

  const datasource = await getDataSourceSrv().get(datasourceRef.uid);

  if (signal?.aborted) {
    return [];
  }

  const interpolated: AnnotationQuery = {
    ...annotation,
    expr: annotation.expr ? interpolateAnnotationExpr(annotation.expr, job, instance) : annotation.expr,
  };

  if (shouldUseLegacyAnnotationRunner(datasource)) {
    const events = await executeLegacyAnnotationQuery({
      datasource,
      annotation: interpolated,
      timeRange,
    });

    if (signal?.aborted || events.length === 0) {
      return [];
    }

    const processed = dedupAnnotationEvents(postProcessAnnotationEvents(interpolated, events));

    return processed.length > 0 ? [annotationEventsToFrame(processed)] : [];
  }

  return executeModernAnnotationQuery({
    datasource,
    annotation: interpolated,
    timeRange,
    timezone,
  });
}

export async function executeDashboardAnnotationQueries(options: {
  annotations: AnnotationQuery[];
  timeRange: TimeRange;
  timezone: string;
  job: string;
  instance: string;
  signal?: AbortSignal;
}): Promise<Record<string, DataFrame[]>> {
  const results: Record<string, DataFrame[]> = {};

  for (const annotation of options.annotations) {
    if (!annotation.name) {
      continue;
    }

    try {
      results[annotation.name] = await executeDashboardAnnotationQuery({
        annotation,
        timeRange: options.timeRange,
        timezone: options.timezone,
        job: options.job,
        instance: options.instance,
        signal: options.signal,
      });
    } catch {
      results[annotation.name] = [];
    }
  }

  return results;
}
