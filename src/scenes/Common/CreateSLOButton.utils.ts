import type { SLO } from './useSLOCheckLinks.types';
import { Check } from 'types';

export type SLOLabel = { key: string; value: string };
type LinkedSLOLabels = Pick<SLO, 'labels'>;

export function buildSLOLabels(check: Check): SLOLabel[] {
  return [
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

export type SLOWizardInitialValues = {
  name?: string;
  description?: string;
  query?: SLORatioQuery;
  labels?: SLOLabel[];
};

export const SM_OBJECTIVE_KIND_LABEL_KEY = 'sm_objective_kind';
export const REACHABILITY_OBJECTIVE_KIND_VALUE = 'reachability';

export function linkedSLOsHaveReachabilityObjectiveKind(linkedSLOs: LinkedSLOLabels[]): boolean {
  return linkedSLOs.some((slo) =>
    slo.labels?.some(
      (label) => label.key === SM_OBJECTIVE_KIND_LABEL_KEY && label.value === REACHABILITY_OBJECTIVE_KIND_VALUE
    )
  );
}

export function buildSLOWizardInitialValuesForCheck(
  check: Check,
  linkedSLOs: LinkedSLOLabels[]
): SLOWizardInitialValues {
  if (linkedSLOsHaveReachabilityObjectiveKind(linkedSLOs)) {
    return {};
  }

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
