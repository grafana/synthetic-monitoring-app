/**
 * Vendored copy of the `grafana-slo-app` extension contract. We cannot import
 * cross-repo: plugins are separately built bundles loaded at runtime, so nothing
 * flows across the boundary at compile time.
 *
 * Sources (grafana/slo):
 * - API contract: https://github.com/grafana/slo/blob/main/src/types/extensiontypes.ts
 * - `SLO` shape:  https://github.com/grafana/slo/blob/main/src/generated/slo/v0-0/types.gen.ts
 *
 * Everything below `SLO` is copied verbatim from the generated schema (minus its
 * runtime `defaultX()` factories) so it stays diffable against upstream. The only
 * renames are for our `SLO` acronym convention: upstream `Slo` -> `SLO`,
 * `SloApiV1` -> `SLOApiV1`, `SloCreateResponseV1` -> `SLOCreateResponseV1`. The
 * method keys (`getSlos`, `updateSlo`, ...) are part of the contract and must not
 * be renamed.
 *
 * Replace this file with `@grafana/plugin-types/grafana-slo-app` once the SLO app
 * onboards to that package.
 */

/** Matches `pkg/api/slo_handlers.go` `SLOCreateResponse` (POST /slo returns this, not `{ slo }`). */
export interface SLOCreateResponseV1 {
  message: string;
  uuid: string;
}

/**
 * CRUD API exposed via `plugin.addFunction` target `grafana-slo-app/slo-api/v1`.
 * Plain async functions — no Redux / RTK Query types in the contract.
 *
 * Reads always issue a network request (never served from a stale in-memory cache).
 * Failures reject with an error exposing `status` (HTTP code) and `message`. Duck-type
 * those fields rather than using `instanceof` across plugin bundle boundaries.
 * Non-HTTP failures (unexpected client errors) reject unchanged.
 */
export interface SLOApiV1 {
  getSlos: () => Promise<{ slos: SLO[] }>;
  getSlo: (uuid: string) => Promise<SLO>;
  addSlo: (slo: SLO) => Promise<SLOCreateResponseV1>;
  updateSlo: (slo: SLO) => Promise<void>;
  deleteSlo: (uuid: string) => Promise<{ uuid: string }>;
}

export interface Objective {
  // is a value between 0 and 1 if the value of the query's output
  // is above the objective, the SLO is met.
  value: number;
  // is a Prometheus-parsable time duration string like 24h, 60m. This is the time
  // window the objective is measured over.
  window: string;
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

export interface ThresholdQuery {
  groupByLabels?: string[];
  thresholdExpression: string;
  threshold: Threshold;
  // datasourceUid the SLI query runs against, when unset fallback to `spec.destinationDatasource.uid`
  sourceDatasourceUid?: string;
}

export interface Threshold {
  // the threshold to compare the calculated expression against
  value: number;
  // Operator to define the threshold condition for the SLO.
  // Example usage:
  // - For success thresholds: use "< 1.5" to ensure response times remain below 1.5 seconds.
  // - For failure thresholds: use "> 80%" to alert when memory usage exceeds 80%.
  operator: '<' | '<=' | '==' | '!=' | '>=' | '>';
}

export interface FailureThresholdQuery {
  groupByLabels?: string[];
  failureThresholdExpression: string;
  threshold: Threshold;
  // datasourceUid the SLI query runs against, when unset fallback to `spec.destinationDatasource.uid`
  sourceDatasourceUid?: string;
}

export interface RatioQuery {
  groupByLabels?: string[];
  successMetric: MetricDef;
  totalMetric: MetricDef;
  // datasourceUid the SLI query runs against, when unset fallback to `spec.destinationDatasource.uid`
  sourceDatasourceUid?: string;
}

export interface MetricDef {
  prometheusMetric: string;
  type?: string;
}

export interface FailureRatioQuery {
  groupByLabels?: string[];
  failureMetric: MetricDef;
  totalMetric: MetricDef;
  // datasourceUid the SLI query runs against, when unset fallback to `spec.destinationDatasource.uid`
  sourceDatasourceUid?: string;
}

export interface FreeformQuery {
  query: string;
  // datasourceUid the SLI query runs against, when unset fallback to `spec.destinationDatasource.uid`
  sourceDatasourceUid?: string;
}

export interface GrafanaQueries {
  grafanaQueries: GrafanaQuery[];
}

export type GrafanaQuery = Record<string, any>;

export interface Label {
  key: string;
  value: string;
}

export interface AlertingMetadata {
  labels?: Label[];
  annotations?: Label[];
  // Enrichments to apply when this burn rate alert fires.
  enrichments?: AlertEnrichment[];
}

export interface AlertEnrichment {
  // The type of enrichment to apply when the alert fires.
  type: 'assistantInvestigation';
}

export interface DashboardRef {
  UID: string;
}

export interface AdvancedOptions {
  // The number of failures required before an alert will trigger. This can be used to reduce
  // noisiness in alerting for lower-traffic systems.
  // For Ratio queries, the failure count is totalMetric - successMetric
  // For Freeform queries that can be parsed as a ratio of counters,
  // the failure count is denominator - numerator
  // Setting 0 and leaving this unset have the same effect.
  minFailures?: number;
}

export interface Alerting {
  // will be attached to all alerts generated by any of these rules.
  labels?: Label[];
  // will be attached to all alerts generated by any of these rules.
  annotations?: Label[];
  // Metadata to attach only to fastBurn alerts.
  fastBurn?: AlertingMetadata;
  // Metadata to attach only to slowBurn alerts.
  slowBurn?: AlertingMetadata;
  // Advanced options for Alert rules
  advancedOptions?: AdvancedOptions;
}

export interface Status {
  type: 'error' | 'creating' | 'created' | 'updated' | 'updating' | 'deleting' | 'unknown';
  // Only present if type == "error"
  message?: string;
}

export interface MaintenanceEvent {
  // Name of the MaintenanceEvent resource that targets this SLO.
  name: string;
  // Start of the maintenance window, RFC 3339 / ISO 8601.
  startTimeIso8601: string;
  // End of the maintenance window, RFC 3339 / ISO 8601. Absent for open-ended windows.
  endTimeIso8601?: string;
}

export interface ReadOnly {
  // The creation, update, or deletion status of the SLO subresources.
  // The possible values are:
  // - creating: The SLO is being created.
  // - created: The SLO has been created.
  // - updating: The SLO is being updated.
  // - updated: The SLO has been updated.
  // - deleting: The SLO is being deleted.
  // - unknown: The SLO state could not be determined.
  // - error: The SLO has encountered during creation, update, or deletion.
  //  The error message will be in the status message.
  status?: Status;
  drillDownDashboardRef?: DashboardRef;
  // describes the provenance of the creation request, used to indicate As-Code created SLOs
  provenance?: string;
  // indicates if the SLO parses as a Ratio query
  parsesAsRatio?: boolean;
  // describes the allowed actions on a SLO (read, write)
  allowedActions?: string[];
  // The datasource from which the metrics are sourced, for BigTent SLOs this can be different from the destinationDatasource
  // For Mimir SLOs, this will be the same as the destinationDatasource
  sourceDatasource?: DestinationDatasource;
  // Creation timestamp in Unix Milliseconds
  creationTimestamp: number;
  // Maintenance windows currently associated with this SLO. Sorted by name
  // for stable ordering. Empty or absent when no windows are associated.
  maintenanceEvents?: MaintenanceEvent[];
}

export interface DestinationDatasource {
  // UID of the datasource, if not present should default to the plugin's configured default datasource
  uid?: string;
  // type of the datasource, if not present should default to mimir
  type?: string;
}

export interface Folder {
  // optional field - UID of the folder the SLO is associated to
  uid?: string;
}

/** Upstream name: `Slo`. */
export interface SLO {
  // A unique, random identifier. This value will also be the name of the
  // resource stored in the API server. Must be set for a PUT.
  uuid: string;
  // should be a short description of your indicator. Consider names like
  // "API Availability"
  name: string;
  // The datasource where recorded metrics will be stored. For a Mimir or
  // other ruler-api implementing datasource, this is also the source of
  // the metrics. For a `grafanaQueries` query, this should be set to `grafanacloud-prom`
  destinationDatasource?: DestinationDatasource;
  folder?: Folder;
  // is a free-text field that can provide more context to an
  // SLO. It is shown on SLO drill-down dashboards and in hover text on
  // the SLO summary dashboard.
  description: string;
  // describes the indicator that will be measured against the
  // objective. Four query types are supported:
  // 1. Ratio Queries provide a successMetric and totalMetric whose ratio is the SLI.
  // 2. Threshold Queries provide a thresholdMetric and a threshold. The
  //    SLI is the boolean result of evaluating the threshould.
  // 3. Freeform Queries supply a single freeFormQuery string that is
  //    evaluated to produce the SLI output. The value should range beween 0
  //    and 1.0. Freeform queries should include a time variable named
  //    either `$__rate_interval`,`$__interval` or `$__range`. This will be used by the
  //    tool to evaluate the burn rate of an SLO over various time
  //    windows. Queries that don't include this interval will have
  //    sensitive and imprecise alerting.
  // Additionally, "groupByLabels" are used in the first three query types
  // to define how to group series for evaluation. They are discarded for
  // freeform queries.
  query: Query;
  // You can have multiple time windows and objectives associated with an
  // SLO. Over each rolling time window, the remaining error budget will
  // be calculated, and separate alerts can be generated for each time
  // window based on the SLO burn rate or remaining error budget.
  objectives: Objective[];
  // Any additional labels that will be attached to all metrics generated
  // from the query. These labels are useful for grouping SLOs in
  // dashboard views that you create by hand.
  // The key must match the prometheus label requirements regex:
  // "^[a-zA-Z_][a-zA-Z0-9_]*$"
  labels?: Label[];
  // The name of a search expression in Grafana Asserts. This is used in the SLO UI to open
  // the Asserts RCA workbench and in alerts to link to the RCA workbench.
  searchExpression?: string;
  // Configures the alerting rules that will be generated for each
  // time window associated with the SLO. Grafana SLOs can generate
  // alerts when the short-term error budget burn is very high, the
  // long-term error budget burn rate is high, or when the remaining
  // error budget is below a certain threshold.
  alerting?: Alerting;
  // Contains fields that are read-only and can't be set by the user.
  readOnly?: ReadOnly;
}
