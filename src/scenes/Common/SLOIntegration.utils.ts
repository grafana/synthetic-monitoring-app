import type { SLORatioQuery, SLOWizardInitialValues } from './grafanaSLOApp.types';
import { Check } from 'types';

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

export const SM_OBJECTIVE_KIND_LABEL_KEY = 'sm_objective_kind';
export const REACHABILITY_OBJECTIVE_KIND_VALUE = 'reachability';

export function buildSLOWizardInitialValuesForCheck(check: Check): SLOWizardInitialValues {
  return {
    name: buildSLOName(check),
    description: buildSLODescription(check),
    query: buildSLOQuery(check),
    labels: [
      {
        key: SM_OBJECTIVE_KIND_LABEL_KEY,
        value: REACHABILITY_OBJECTIVE_KIND_VALUE,
      },
      { key: 'source', value: 'grafana-synthetic-monitoring-app' },
    ],
  };
}
