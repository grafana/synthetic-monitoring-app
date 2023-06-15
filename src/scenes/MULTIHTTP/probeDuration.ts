import { DataSourceRef } from '@grafana/data';
import { SceneFlexItem, SceneQueryRunner, VizPanel } from '@grafana/scenes';

function getQueryRunner(metrics: DataSourceRef) {
  return new SceneQueryRunner({
    queries: [
      {
        refId: 'A',
        editorMode: 'code',
        expr: 'sum(probe_http_total_duration_seconds{job="aghaha", instance="http://www.example.com"})',
        legendFormat: '__auto',
        range: true,
      },
    ],
    datasource: metrics,
  });
}

export function getProbeDuration(metrics: DataSourceRef) {
  return new SceneFlexItem({
    body: new VizPanel({
      $data: getQueryRunner(metrics),
      pluginId: 'timeseries',
      fieldConfig: {
        defaults: {
          unit: 's',
        },
        overrides: [],
      },
    }),
  });
}
