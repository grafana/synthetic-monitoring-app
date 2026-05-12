/**
 * Types sourced from grafana-slo-app generated schema (`slo/v0-0/types.gen.ts`).
 * We cannot import cross-repo so we maintain a local copy of the subset we consume.
 */

export interface Label {
  key: string;
  value: string;
}

export interface MetricDef {
  prometheusMetric: string;
  type?: string;
}

export interface RatioQuery {
  groupByLabels?: string[];
  successMetric: MetricDef;
  totalMetric: MetricDef;
}

export interface Threshold {
  value: number;
  operator: '<' | '<=' | '==' | '!=' | '>=' | '>';
}

export interface ThresholdQuery {
  groupByLabels?: string[];
  thresholdExpression: string;
  threshold: Threshold;
}

export interface FailureRatioQuery {
  groupByLabels?: string[];
  failureMetric: MetricDef;
  totalMetric: MetricDef;
}

export interface FailureThresholdQuery {
  groupByLabels?: string[];
  failureThresholdExpression: string;
  threshold: Threshold;
}

export interface FreeformQuery {
  query: string;
}

export type GrafanaQuery = Record<string, any>;

export interface GrafanaQueries {
  grafanaQueries: GrafanaQuery[];
}

export interface Query {
  type: 'threshold' | 'failureThreshold' | 'ratio' | 'failureRatio' | 'freeform' | 'grafanaQueries';
  threshold?: ThresholdQuery;
  failureThreshold?: FailureThresholdQuery;
  ratio?: RatioQuery;
  failureRatio?: FailureRatioQuery;
  freeform?: FreeformQuery;
  grafanaQueries?: GrafanaQueries;
}

export interface Objective {
  value: number;
  window: string;
}

export interface DestinationDatasource {
  uid?: string;
  type?: string;
}

export interface Folder {
  uid?: string;
}

export interface DashboardRef {
  UID: string;
}

export interface Status {
  type: 'error' | 'creating' | 'created' | 'updated' | 'updating' | 'deleting' | 'unknown';
  message?: string;
}

export interface AlertingMetadata {
  labels?: Label[];
  annotations?: Label[];
}

export interface Alerting {
  labels?: Label[];
  annotations?: Label[];
  fastBurn?: AlertingMetadata;
  slowBurn?: AlertingMetadata;
}

export interface ReadOnly {
  status?: Status;
  drillDownDashboardRef?: DashboardRef;
  provenance?: string;
  parsesAsRatio?: boolean;
  allowedActions?: string[];
  sourceDatasource?: DestinationDatasource;
  creationTimestamp: number;
}

export interface SLO {
  uuid: string;
  name: string;
  destinationDatasource?: DestinationDatasource;
  folder?: Folder;
  description: string;
  query: Query;
  objectives: Objective[];
  labels?: Label[];
  searchExpression?: string;
  alerting?: Alerting;
  readOnly?: ReadOnly;
}

