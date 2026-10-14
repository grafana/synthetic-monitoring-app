import { dataFrameToJSON, FieldType, toDataFrame } from '@grafana/data';

export const FRONTEND_TIMEPOINT_START = 1_791_393_600_000;
export const FRONTEND_RUN_DURATION = 20_000;

export interface FrontendContextRun {
  probe: string;
  executionId: string;
  startOffset: number;
  error: string;
  appEnvironment?: string;
  success?: boolean;
  records?: Array<Record<string, string>>;
}

export const OHIO_FRONTEND_RUN: FrontendContextRun = {
  probe: 'Ohio',
  executionId: 'ohio-exec',
  startOffset: 60_000,
  error: 'TypeError: cart is undefined',
  appEnvironment: 'production',
};

export const OHIO_FRONTEND_RETRY: FrontendContextRun = {
  probe: 'Ohio',
  executionId: 'ohio-retry-exec',
  startOffset: 4 * 60_000,
  error: 'NetworkError when attempting to fetch resource',
  appEnvironment: 'production',
};

export const OREGON_FRONTEND_RUN: FrontendContextRun = {
  probe: 'Oregon',
  executionId: 'oregon-exec',
  startOffset: 90_000,
  error: "Response not ok. Status code: 500. Message: 'Failed to load products'",
  appEnvironment: 'production',
};

/** A browser check's Faro records as Grafana's /api/ds/query returns them. */
export function faroRunFrame(run: FrontendContextRun, refId = 'faroRunContext') {
  const common = {
    app_id: '5385',
    app_name: 'ecommerce',
    app_environment: run.appEnvironment ?? '',
    app_version: '1.0.0',
    app_bundle_id: 'current-build',
    session_id: `${run.executionId}-session`,
    page_id: '/',
    k6_isK6Browser: 'true',
    k6_testRunId: `sm:${run.executionId}`,
  };
  const records = (
    run.records ?? [
      { kind: 'measurement', type: 'web-vitals' },
      { kind: 'exception', type: 'Error', value: run.error },
    ]
  ).map((record) => ({ ...common, ...record }));
  const start = FRONTEND_TIMEPOINT_START + run.startOffset;

  return dataFrameToJSON(
    toDataFrame({
      refId,
      fields: [
        { name: 'labels', type: FieldType.other, values: records },
        { name: 'timestamp', type: FieldType.time, values: records.map((_, index) => start + 1000 + index) },
        { name: 'body', type: FieldType.string, values: records.map(() => '') },
        { name: 'labelTypes', type: FieldType.other, values: records.map(() => ({})) },
        { name: 'id', type: FieldType.string, values: records.map((_, index) => `${run.executionId}-${index}`) },
      ],
    })
  );
}

export function faroMetricFrame(refId: string, labels: Record<string, string>, points: Array<[number, number]>) {
  return dataFrameToJSON(
    toDataFrame({
      refId,
      fields: [
        { name: 'Time', type: FieldType.time, values: points.map(([time]) => time) },
        { name: 'Value', type: FieldType.number, labels, values: points.map(([, value]) => value) },
      ],
    })
  );
}

export const CURRENT_BUILD_SOURCE_MAP = { ID: 'current-build', Created: '2026-10-07T17:30:00.000Z' };
