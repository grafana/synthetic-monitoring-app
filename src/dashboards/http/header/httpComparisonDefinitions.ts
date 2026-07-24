import { type DashboardPanelDefinition } from 'dashboards/hooks/useDashboardPanelQuery';

export function createHttpExecutionPresenceDefinition(): DashboardPanelDefinition {
  return {
    id: 'http-comparison-execution-presence',
    pluginId: 'timeseries',
    fieldConfig: { defaults: {}, overrides: [] },
    options: {},
    maxDataPoints: 8760,
    targets: [
      {
        refId: 'executions',
        expr:
          'sum(increase(probe_all_success_count{probe=~"$probe", instance="$instance", job="$job"}[1h]))',
        interval: '1h',
        range: true,
      },
    ],
  };
}
