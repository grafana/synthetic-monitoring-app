import { SceneFlexItem, SceneQueryRunner, VizPanel } from '@grafana/scenes';
import { DataSourceRef } from '@grafana/schema';

function getQueryRunner(metrics: DataSourceRef) {
  return new SceneQueryRunner({
    queries: [
      {
        refId: 'A',
        editorMode: 'code',
        expr: 'sum by (probe) (probe_http_total_duration_seconds{probe=~"${probe}", job="${job}", instance="${instance}"})',
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
      title: 'Duration by probe',
      fieldConfig: {
        defaults: {
          unit: 's',
        },
        overrides: [],
      },
    }),
  });
}
