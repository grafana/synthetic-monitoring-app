import { SceneFlexItem, SceneQueryRunner, VizPanel } from '@grafana/scenes';
import { DataSourceRef } from '@grafana/schema';

function getQueryRunner(metrics: DataSourceRef) {
  return new SceneQueryRunner({
    datasource: metrics,
    queries: [
      {
        refId: 'A',
        expr: 'sum by (phase) (probe_http_duration_seconds{job="$job", instance="$instance", url="$stepUrl"})',
        legendFormat: '__auto',
        range: true,
      },
    ],
  });
}

export function getLatencyByPhasePanel(metrics: DataSourceRef) {
  return new SceneFlexItem({
    body: new VizPanel({
      $data: getQueryRunner(metrics),
      pluginId: 'barchart',
      title: 'Latency by phase',
      fieldConfig: {
        defaults: {
          unit: 's',
        },
        overrides: [],
      },
      options: {
        stacking: 'normal',
      },
    }),
  });
}
