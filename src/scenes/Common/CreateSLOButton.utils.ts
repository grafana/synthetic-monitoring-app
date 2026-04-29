import { Check } from 'types';

export type SLOLabel = { key: string; value: string };

export function buildSLOLabels(check: Check): SLOLabel[] {
  return [
    { key: 'sm_check_id', value: String(check.id) },
    { key: 'source', value: `grafana-synthetic-monitoring-app` },
  ];
}

export type SLORatioQuery = {
  type: 'ratio';
  ratioQuery: {
    successMetric: string;
    totalMetric: string;
    groupByLabels: string;
  };
};

const REACHABILITY_SUFFIX = ' (Reachability)';

function quotePrometheusMatcherValue(value: string): string {
  return JSON.stringify(value);
}

function buildMetricSelector(matchers: Record<string, string>): string {
  const entries = Object.entries(matchers)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${quotePrometheusMatcherValue(value)}`);
  return `{${entries.join(', ')}}`;
}

export function buildSLOQuery(check: Check): SLORatioQuery {
  const selector = buildMetricSelector({ job: check.job, instance: check.target });
  return {
    type: 'ratio',
    ratioQuery: {
      successMetric: `probe_all_success_sum${selector}`,
      totalMetric: `probe_all_success_count${selector}`,
      groupByLabels: 'job,instance',
    },
  };
}

export function buildSLOName(check: Check): string {
  return `${check.job}${REACHABILITY_SUFFIX}`;
}

export function buildSLODescription(check: Check): string {
  return `Reachability SLI from Synthetic Monitoring. Job: ${check.job} | Instance: ${check.target}`;
}
