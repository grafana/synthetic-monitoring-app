/**
 * Queries shaped for Grafana SLO **resource** API (not the same as arbitrary UI PromQL).
 *
 * - **Ratio mode**: bare counter series (no `rate()`, no `sum()`); see API validation:
 *   "Rate and range calculations are auto-filled", "Aggregations are auto-filled with Group by labels".
 * - **Freeform mode**: full expression with joins; API validation requires a Grafana range macro in `rate()` / ranges
 *   (e.g. `[$__rate_interval]`, `$__range`, or `$__interval`).
 */

import { metricSelector } from 'queries/sloPromql';

import type { SloApiQuerySpec } from './buildReachabilitySloCreateRequest';

/** SLO plugin substitutes this when evaluating freeform queries (fixed `[5m]` fails validation). */
const RANGE = '[$__rate_interval]';

/**
 * One SM check: bare `probe_all_success_*` counters scoped to job+instance.
 * Roll up probes via `groupByLabels` (API adds aggregations / rate).
 */
export function buildSingleCheckSloApiQuery(job: string, instance: string): SloApiQuerySpec {
  const sel = metricSelector({ job, instance });
  return {
    kind: 'ratio',
    successMetric: `probe_all_success_sum${sel}`,
    totalMetric: `probe_all_success_count${sel}`,
    groupByLabels: ['job', 'instance'],
  };
}

/**
 * Label-filtered fleet: same shape as a working SLO UI query, as **freeform** (ratio API
 * cannot express arbitrary `sum by` + `* on()` joins on two separate metric strings).
 */
export function buildLabelGroupedSloApiFreeformQuery(matchers: Record<string, string>): SloApiQuerySpec {
  const keys = Object.keys(matchers).sort((a, b) => a.localeCompare(b));
  if (keys.length === 0) {
    throw new Error('At least one sm_check_info matcher is required');
  }

  const smSelector = metricSelector(matchers);
  const maxByLabels = ['instance', 'job', 'check_name', ...keys].join(', ');
  const groupLeft = ['check_name', ...keys].join(', ');

  const side = (counter: 'probe_all_success_sum' | 'probe_all_success_count') =>
    `sum by(instance, job) (rate(${counter}${RANGE})) * on(instance, job) group_left(${groupLeft}) max by(${maxByLabels}) (sm_check_info${smSelector})`;

  return {
    kind: 'freeform',
    query: `(${side('probe_all_success_sum')}) / (${side('probe_all_success_count')})`,
  };
}
