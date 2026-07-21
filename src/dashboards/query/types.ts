import { DataFrame, FieldType } from '@grafana/data';

export type DashboardQueryTarget = {
  refId: string;
  expr?: string;
  query?: string;
  hidden?: boolean;
  instant?: boolean;
  range?: boolean;
  legendFormat?: string;
  format?: string;
  datasource?: {
    uid?: string;
    type?: string;
  };
};

export type DashboardQuerySemanticValues = {
  job: string;
  instance: string;
  probes: string[];
  rangeSeconds: number;
  interval: string;
  intervalMs: number;
  rateInterval: string;
};

export type ResolvedQueryRequest = {
  datasourceUid: string;
  datasourceType: string;
  targets: DashboardQueryTarget[];
  range: { from: number; to: number };
  timezone: string;
  interval: string;
  intervalMs: number;
  maxDataPoints: number;
  requestId: string;
};

export type QueryTargetError = {
  refId: string;
  message: string;
};

export type QueryExecutionResult = {
  requestId: string;
  datasourceUid: string;
  frames: DataFrame[];
  errors?: QueryTargetError[];
  fatalError?: string;
};

export type ExecuteQueriesResult = {
  results: QueryExecutionResult[];
  aborted: boolean;
};

export function createValueFrame(refId: string, value: number): DataFrame {
  return {
    refId,
    fields: [
      {
        name: `Value #${refId}`,
        type: FieldType.number,
        values: [value],
        config: {},
      },
    ],
    length: 1,
  };
}
