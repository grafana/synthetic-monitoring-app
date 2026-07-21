import { DashboardPanelDefinition } from 'dashboards/hooks/useDashboardPanelQuery';

export function createErrorLogsPanelDefinition(unsuccessfulOnly: boolean): DashboardPanelDefinition {
  return {
    id: 'http-error-logs',
    pluginId: 'logs',
    title: 'Logs for checks: $probe ⮕ $job / $instance',
    datasourceType: 'loki',
    targets: [
      {
        expr: `{probe=~"$probe", instance="$instance", job="$job", probe_success=~"${unsuccessfulOnly ? '0' : '.*'}"} | logfmt`,
        refId: 'Execution_Logs',
      },
    ],
    fieldConfig: { defaults: {}, overrides: [] },
    options: {
      showTime: true,
      showLabels: true,
      showCommonLabels: false,
      wrapLogMessage: true,
      prettifyLogMessage: false,
      enableLogDetails: true,
      dedupStrategy: 'none',
      sortOrder: 'Descending',
    },
  };
}
