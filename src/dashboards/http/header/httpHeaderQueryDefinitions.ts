import { DashboardPanelDefinition } from 'dashboards/hooks/useDashboardPanelQuery';

const selector = 'probe=~"$probe", instance="$instance", job="$job"';
const total = `sum(increase(probe_all_success_count{${selector}}[$__range]))`;
const successful = `sum(increase(probe_all_success_sum{${selector}}[$__range]))`;
const totalByProbe = `sum by (probe) (increase(probe_all_success_count{${selector}}[$__range]))`;
const successfulByProbe = `sum by (probe) (increase(probe_all_success_sum{${selector}}[$__range]))`;

const baseDefinition = {
  pluginId: 'stat',
  fieldConfig: { defaults: {}, overrides: [] },
  options: {},
};

export function createExecutionCountsDefinition(): DashboardPanelDefinition {
  return {
    ...baseDefinition,
    id: 'http-header-execution-counts',
    targets: [
      { refId: 'total', expr: total, instant: true },
      { refId: 'successful', expr: successful, instant: true },
      { refId: 'failed', expr: `clamp_min((${total}) - (${successful}), 0)`, instant: true },
    ],
  };
}

export function createReachabilityBreakdownDefinition(): DashboardPanelDefinition {
  return {
    ...baseDefinition,
    id: 'http-header-reachability-breakdown',
    targets: [
      { refId: 'reachability', expr: `(${successfulByProbe}) / (${totalByProbe})`, instant: true },
      {
        refId: 'failed',
        expr: `clamp_min((${totalByProbe}) - (${successfulByProbe}), 0)`,
        instant: true,
      },
    ],
  };
}
