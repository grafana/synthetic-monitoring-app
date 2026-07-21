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
  rangeUtil,
  TimeRange,
} from '@grafana/data';
import { getDataSourceSrv, getRunRequest, getTemplateSrv } from '@grafana/runtime';
import { firstValueFrom } from 'rxjs';

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

async function executeLegacyAnnotationQuery(options: {
  datasource: DataSourceApi;
  annotation: AnnotationQuery;
  timeRange: TimeRange;
}): Promise<AnnotationEvent[]> {
  const { datasource, annotation, timeRange } = options;

  if (!datasource.annotationQuery) {
    return [];
  }

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
}): Promise<DataFrame[]> {
  const { datasource, annotation, timeRange } = options;

  const request: DataQueryRequest = {
    app: CoreApp.Dashboard,
    requestId: `dashboard-annotation-${annotation.name}`,
    timezone: 'browser',
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
  const panelData = await firstValueFrom(runRequest(datasource, request));
  const frames = panelData.series?.length ? panelData.series : panelData.annotations ?? [];

  return frames.map((frame) => ({
    ...frame,
    meta: {
      ...frame.meta,
      dataTopic: frame.meta?.dataTopic ?? DataTopic.Annotations,
    },
  }));
}

export async function executeDashboardAnnotationQuery(options: {
  annotation: AnnotationQuery;
  timeRange: TimeRange;
  job: string;
  instance: string;
  signal?: AbortSignal;
}): Promise<DataFrame[]> {
  const { annotation, timeRange, job, instance, signal } = options;
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
  });
}

export async function executeDashboardAnnotationQueries(options: {
  annotations: AnnotationQuery[];
  timeRange: TimeRange;
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
