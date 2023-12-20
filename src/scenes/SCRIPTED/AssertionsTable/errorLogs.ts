import { SceneFlexItem, SceneFlexLayout, SceneQueryRunner } from '@grafana/scenes';
import { DataSourceRef } from '@grafana/schema';

import { ExplorablePanel } from 'scenes/ExplorablePanel';

function getQueryRunner(logs: DataSourceRef, name: string) {
  return new SceneQueryRunner({
    datasource: logs,
    queries: [
      {
        expr: `
          {job="$job", instance="$instance"} |
            logfmt msg, level, method, url, check |
            __error__ = "" |
            msg = "check result" |
            check="${name}" |
            level != "debug" |
            line_format "{{.method}} {{.url}} ➜ {{ if eq .value \\"1\\" }}PASS{{else}}FAIL{{end}}: {{.check}}" |
            label_format level="{{ if eq .value \\"1\\" }}info{{else}}error{{end}}"`,
        refId: 'A',
      },
    ],
  });
}

// scene: new SceneFlexItem({
export function getErrorLogs(logs: DataSourceRef, name: string) {
  const flexItem = new SceneFlexLayout({
    width: '100%',
    height: 400,
    children: [
      new SceneFlexItem({
        body: new ExplorablePanel({
          $data: getQueryRunner(logs, name),
          options: {
            showTime: true,
            showLabels: false,
            showCommonLabels: false,
            wrapLogMessage: true,
            prettifyLogMessage: false,
            enableLogDetails: true,
            dedupStrategy: 'none',
            sortOrder: 'Descending',
          },
          title: 'Error logs for ' + name,
          pluginId: 'logs',
        }),
      }),
    ],
  });
  return flexItem;
}
