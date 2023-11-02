import { SceneFlexItem, SceneQueryRunner } from '@grafana/scenes';
import { DataSourceRef } from '@grafana/schema';
import { ExplorablePanel } from 'scenes/ExplorablePanel';

function getQueryRunner(metrics: DataSourceRef) {
  return new SceneQueryRunner({
    datasource: metrics,
    queries: [
      {
        refId: 'A',
        expr: `
        sum by (phase) (probe_http_duration_seconds{job="$job", instance="$instance", name="$activeStepIndex", method="$stepMethod", probe=~"$probe"})
/
        count by (phase) (probe_http_duration_seconds{job="$job", instance="$instance", name="$activeStepIndex", method="$stepMethod", probe=~"$probe"})
        `,
        legendFormat: '__auto',
        range: true,
      },
    ],
  });
}

export function getLatencyByPhasePanel(metrics: DataSourceRef) {
  return new SceneFlexItem({
    body: new ExplorablePanel({
      $data: getQueryRunner(metrics),
      pluginId: 'barchart',
      title: 'Latency by phase for $stepUrl',
      fieldConfig: {
        defaults: {
          unit: 's',
        },
        overrides: [],
      },
      options: {
        stacking: 'normal',
        xTickLabelSpacing: 75,
      },
    }),
  });
}
