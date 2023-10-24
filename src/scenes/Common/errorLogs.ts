import { SceneQueryRunner } from '@grafana/scenes';
import { DataSourceRef } from '@grafana/schema';
import { ExplorablePanel } from 'scenes/ExplorablePanel';

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
  return new ExplorablePanel({
    pluginId: 'logs',
    title: 'Logs for failed checks: $probe ⮕ $job / $instance',
    $data: getQueryRunner(logs),
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
