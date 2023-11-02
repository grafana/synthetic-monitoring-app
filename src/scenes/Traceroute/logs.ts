import { SceneQueryRunner } from '@grafana/scenes';
import { DataSourceRef } from '@grafana/schema';

import { ExplorablePanel } from 'scenes/ExplorablePanel';

function getQueryRunner(logs: DataSourceRef) {
  return new SceneQueryRunner({
    datasource: logs,
    queries: [
      {
        expr: '{instance="$instance", job="$job", probe=~"$probe", check_name="traceroute"}',
        refId: 'A',
      },
    ],
  });
}

export function getLogsPanel(logs: DataSourceRef) {
  return new ExplorablePanel({
    pluginId: 'logs',
    $data: getQueryRunner(logs),
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
