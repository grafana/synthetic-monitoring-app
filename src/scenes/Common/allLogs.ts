import { SceneQueryRunner } from '@grafana/scenes';
import { DataSourceRef } from '@grafana/schema';

import { ExplorablePanel } from 'scenes/ExplorablePanel';

function getQueryRunner(logs: DataSourceRef) {
  return new SceneQueryRunner({
    datasource: logs,
    queries: [
      {
        expr: '{probe=~"$probe", instance="$instance", job="$job"} | logfmt | __error__ = "" | level != "debug"',
        refId: 'A',
      },
    ],
  });
}

export function getAllLogs(logs: DataSourceRef) {
  return new ExplorablePanel({
    pluginId: 'logs',
    title: 'Raw logs: $probe ⮕ $job / $instance',
    $data: getQueryRunner(logs),
    options: {
      showTime: true,
      showLabels: true,
      showCommonLabels: false,
      wrapLogMessage: true,
      prettifyLogMessage: true,
      enableLogDetails: true,
      dedupStrategy: 'none',
      sortOrder: 'Descending',
    },
  });
}
