import { SceneQueryRunner, VizPanel } from '@grafana/scenes';
import { DataSourceRef } from '@grafana/schema';

function getQueryRunner(logs: DataSourceRef) {
  return new SceneQueryRunner({
    datasource: logs,
    queries: [
      {
        expr: '{probe=~"$probe", instance="$instance", job="$job", probe_success="0"}',
        refId: 'A',
      },
    ],
  });
}

export function getErrorLogs(logs: DataSourceRef) {
  return new VizPanel({
    pluginId: 'logs',
    title: 'Logs for failed checks: $probe ⮕ $job / $instance',
    $data: getQueryRunner(logs),
    placement: {
      height: 500,
    },
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
  });
}
