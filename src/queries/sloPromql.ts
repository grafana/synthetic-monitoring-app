/**
 * PromQL helpers for Grafana SLO / ratio queries backed by Synthetic Monitoring
 * reachability metrics (`probe_all_success_*`). See docs/uptime/uptime.md for how
 * this differs from SM "uptime" semantics.
 */

const RATE_RANGE = '[$__rate_interval]';

/** Escape a value for use inside PromQL double-quoted label values. */
export function escapePrometheusLabelValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/"/g, '\\"');
}

export function metricSelector(labels: Record<string, string>): string {
  const inner = Object.entries(labels)
    .map(([k, v]) => `${k}="${escapePrometheusLabelValue(v)}"`)
    .join(',');
  return `{${inner}}`;
}

/**
 * Map a check custom label name to the key on `sm_check_info` today (often `label_` + name).
 * When metrics drop the prefix, update this helper only.
 */
export function checkLabelNameToSmCheckInfoKey(name: string): string {
  return name.startsWith('label_') ? name : `label_${name}`;
}

export type ReachabilitySloQueries = {
  /** Combined ratio (0–1). */
  ratio: string;
  /** Success-side counter rate for ratio-style SLO UIs that take numerator/denominator separately. */
  successQuery: string;
  /** Total attempts counter rate (denominator). */
  totalQuery: string;
};

/**
 * Reachability ratio for a single SM check (`job` + `instance` / target), aggregated
 * across all probes for that check.
 */
export function buildSingleCheckReachabilitySloQueries(job: string, instance: string): ReachabilitySloQueries {
  const sel = metricSelector({ job, instance });
  const successQuery = `sum(rate(probe_all_success_sum${sel}${RATE_RANGE}))`;
  const totalQuery = `sum(rate(probe_all_success_count${sel}${RATE_RANGE}))`;
  const ratio = `(${successQuery}) / (${totalQuery})`;
  return { ratio, successQuery, totalQuery };
}

function buildJoinedReachabilityRateMatchSmCheckInfoInner(
  matchers: Record<string, string>,
  counter: 'probe_all_success_sum' | 'probe_all_success_count'
): string {
  const keys = Object.keys(matchers).sort((a, b) => a.localeCompare(b));
  if (keys.length === 0) {
    throw new Error('At least one sm_check_info matcher is required');
  }

  const smSelector = metricSelector(matchers);
  const maxByLabels = ['instance', 'job', 'check_name', ...keys].join(', ');
  const groupLeft = ['check_name', ...keys].join(', ');

  return `  sum by(instance, job) (rate(${counter}${RATE_RANGE}))
  * on(instance, job) group_left(${groupLeft})
  max by(${maxByLabels}) (sm_check_info${smSelector})`;
}

/**
 * Reachability ratio **per matching check** (one series per check). Prefer
 * {@link buildSmCheckInfoFilteredReachabilitySloAggregatedQueries} for a single SLO over a group.
 */
export function buildSmCheckInfoFilteredReachabilitySloRatio(matchers: Record<string, string>): string {
  const num = buildJoinedReachabilityRateMatchSmCheckInfoInner(matchers, 'probe_all_success_sum');
  const den = buildJoinedReachabilityRateMatchSmCheckInfoInner(matchers, 'probe_all_success_count');
  return `(\n${num}\n)\n/\n(\n${den}\n)`;
}

/**
 * **One combined SLI** for all checks whose `sm_check_info` matches `matchers`: total successful probe
 * executions divided by total attempts across the group (weighted by traffic). Use this for a **single**
 * Grafana SLO that covers multiple checks (for example every check tagged `team=backend`).
 */
export function buildSmCheckInfoFilteredReachabilitySloAggregatedQueries(
  matchers: Record<string, string>
): ReachabilitySloQueries {
  const num = buildJoinedReachabilityRateMatchSmCheckInfoInner(matchers, 'probe_all_success_sum');
  const den = buildJoinedReachabilityRateMatchSmCheckInfoInner(matchers, 'probe_all_success_count');
  const successQuery = `sum(\n${num}\n)`;
  const totalQuery = `sum(\n${den}\n)`;
  const ratio = `(${successQuery}) / (${totalQuery})`;
  return { ratio, successQuery, totalQuery };
}

/** Build `sm_check_info` matchers from this check's custom labels (metric keys via {@link checkLabelNameToSmCheckInfoKey}). */
export function smCheckInfoMatchersFromCheckLabels(
  labels: Array<{ name: string; value: string }>
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const { name, value } of labels) {
    out[checkLabelNameToSmCheckInfoKey(name)] = value;
  }
  return out;
}
