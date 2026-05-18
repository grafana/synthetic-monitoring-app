/**
 * Subset of slo.v0_0.* from Grafana SLO plugin API.
 *
 * Human-oriented guide: https://grafana.com/docs/grafana-cloud/alerting-and-irm/slo/set-up/api/
 * Schema: https://github.com/grafana/slo-openapi-client/blob/main/openapi.yaml
 * (servers.url: /api/plugins/grafana-slo-app/resources)
 */

export type GrafanaSloMetricDef = {
  prometheusMetric: string;
  type?: string;
};

export type GrafanaSloRatioQuery = {
  successMetric: GrafanaSloMetricDef;
  totalMetric: GrafanaSloMetricDef;
  groupByLabels?: string[];
};

export type GrafanaSloQueryRatio = {
  type: 'ratio';
  ratio: GrafanaSloRatioQuery;
};

/** Single PromQL expression returning the SLI ratio (what the SLO UI often uses). */
export type GrafanaSloQueryFreeform = {
  type: 'freeform';
  freeform: {
    query: string;
  };
};

export type GrafanaSloQueryBody = GrafanaSloQueryRatio | GrafanaSloQueryFreeform;

export type GrafanaSloObjective = {
  value: number;
  window: string;
};

/** Match Terraform / openapi client: only `uid` is required in practice; omit `type` unless SLO team specifies it. */
export type GrafanaSloDestinationDatasource = {
  uid: string;
  type?: string;
};

export type GrafanaSloLabel = {
  key: string;
  value: string;
};

/**
 * POST /v1/slo body (slo.v0_0.Slo). Go client always serializes `uuid`; use empty string
 * for create — see grafana/terraform-provider-grafana packSloResource.
 */
export type GrafanaSloCreateRequest = {
  uuid: string;
  name: string;
  description: string;
  destinationDatasource: GrafanaSloDestinationDatasource;
  query: GrafanaSloQueryBody;
  objectives: GrafanaSloObjective[];
  labels?: GrafanaSloLabel[];
};

export type GrafanaSloCreateResponse = {
  message: string;
  uuid: string;
};
