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
        // xTickLabelRotation: 0,
        // xTickLabelSpacing: 100,
        // showValue: 'auto',
        stacking: 'normal',
        // barWidth: 0.97,
        // fullHighlight: false,
        // tooltip: {
        //   mode: 'single',
        //   sort: 'none',
        // },
        // legend: {
        //   showLegend: true,
        //   displayMode: 'list',
        //   placement: 'bottom',
        //   calcs: [],
        // },
      },
    }),
  });
}
