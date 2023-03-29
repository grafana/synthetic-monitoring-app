import { SceneQueryRunner, SceneVariableSet, VizPanel } from '@grafana/scenes';
import { DataSourceRef } from '@grafana/schema';

function getQueryRunner(variables: SceneVariableSet, logs: DataSourceRef) {
  return new SceneQueryRunner({
    datasource: logs,
    $variables: variables,
    queries: [
      {
        expr: '{instance="$instance", job="$job", probe=~"$probe", check_name="traceroute"}',
        refId: 'A',
      },
    ],
  });
}

export function getLogsPanel(variables: SceneVariableSet, logs: DataSourceRef) {
  return new VizPanel({
    pluginId: 'logs',
    $data: getQueryRunner(variables, logs),
    title: 'Raw Logs',
    options: {
      showTime: true,
      showLabels: true,
      showCommonLabels: false,
      wrapLogMessage: false,
      prettifyLogMessage: false,
      enableLogDetails: true,
      dedupStrategy: 'none',
      sortOrder: 'Ascending',
    },
  });
}
