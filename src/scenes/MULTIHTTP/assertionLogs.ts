import { SceneFlexItem, SceneQueryRunner, VizPanel } from '@grafana/scenes';
import { DataSourceRef } from '@grafana/schema';

function getQueryRunner(logs: DataSourceRef) {
  return new SceneQueryRunner({
    datasource: logs,
    queries: [
      {
        expr: '{job="$job", instance="$instance"} |\n logfmt |\n __error__ = "" |\n msg = "check result" |\n line_format "{{.method}} {{.url}} ➜ {{ if eq .value \\"1\\" }}PASS{{else}}FAIL{{end}}: {{.check}}" |\n label_format level="{{ if eq .value \\"1\\" }}info{{else}}error{{end}}"',
        refId: 'A',
      },
    ],
  });
}

export function getAssertionLogsPanel(logs: DataSourceRef) {
  return new SceneFlexItem({
    body: new VizPanel({
      $data: getQueryRunner(logs),
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
      title: 'Assertion results',
      pluginId: 'logs',
    }),
  });
}
