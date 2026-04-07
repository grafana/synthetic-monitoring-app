import type { GrafanaSloCreateRequest, GrafanaSloQueryBody } from './grafanaSlo.types';

export const DEFAULT_SLO_OBJECTIVE = { value: 0.995, window: '28d' } as const;

export type SloApiQuerySpec =
  | {
      kind: 'ratio';
      /** Bare counter selectors — API applies rate/range; no `rate()` / `sum()`. */
      successMetric: string;
      totalMetric: string;
      groupByLabels: string[];
    }
  | {
      kind: 'freeform';
      /** Full PromQL ratio; include `[$__rate_interval]`, `$__range`, or `$__interval` where the API expects it. */
      query: string;
    };

export type SloObjectiveInput = {
  /** Target availability as a fraction, e.g. 0.999 for 99.9% */
  value: number;
  /** Rolling window, e.g. `28d` */
  window?: string;
};

export type BuildReachabilitySloCreateRequestArgs = {
  name: string;
  description: string;
  metricsDatasourceUid: string;
  sloQuery: SloApiQuerySpec;
  /** Defaults to 99.5% over 28d */
  objective?: SloObjectiveInput;
  /** Provenance for the SLO object */
  labels?: Array<{ key: string; value: string }>;
};

function buildQueryBody(spec: SloApiQuerySpec): GrafanaSloQueryBody {
  if (spec.kind === 'freeform') {
    return {
      type: 'freeform',
      freeform: { query: spec.query },
    };
  }
  return {
    type: 'ratio',
    ratio: {
      successMetric: { prometheusMetric: spec.successMetric },
      totalMetric: { prometheusMetric: spec.totalMetric },
      groupByLabels: spec.groupByLabels,
    },
  };
}

/**
 * Builds an SLO create payload for Synthetic Monitoring reachability.
 *
 * - **ratio**: success/total must be bare metric selectors (e.g. `probe_all_success_sum{job="…"}`).
 *   The SLO backend injects rate/range and aggregations per `groupByLabels`.
 * - **freeform**: one expression (e.g. UI-style `sum by(...) (rate(...)) / ...`) when ratio fields are too strict.
 */
export function buildReachabilitySloCreateRequest({
  name,
  description,
  metricsDatasourceUid,
  sloQuery,
  objective,
  labels,
}: BuildReachabilitySloCreateRequestArgs): GrafanaSloCreateRequest {
  const value = objective?.value ?? DEFAULT_SLO_OBJECTIVE.value;
  const window = objective?.window ?? DEFAULT_SLO_OBJECTIVE.window;
  return {
    uuid: '',
    name,
    description,
    destinationDatasource: {
      uid: metricsDatasourceUid,
    },
    query: buildQueryBody(sloQuery),
    objectives: [{ value, window }],
    labels,
  };
}
