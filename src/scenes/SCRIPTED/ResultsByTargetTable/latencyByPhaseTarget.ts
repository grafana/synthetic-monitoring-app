import { SceneFlexItem, SceneQueryRunner } from '@grafana/scenes';
import { DataSourceRef } from '@grafana/schema';

import { ExplorablePanel } from 'scenes/ExplorablePanel';

function getQueryRunner(metrics: DataSourceRef, name: string) {
  return new SceneQueryRunner({
    datasource: metrics,
    queries: [
      {
        refId: 'A',
        expr: `
        sum by (phase) (probe_http_duration_seconds{job="$job", instance="$instance", name="${name}", probe=~"$probe"})
        /
        count by (phase) (probe_http_duration_seconds{job="$job", instance="$instance", name="${name}", probe=~"$probe"})
        `,
        legendFormat: '__auto',
        range: true,
      },
    ],
  });
}

export function getLatencyByPhaseTarget(metrics: DataSourceRef, name: string) {
  return new SceneFlexItem({
    body: new ExplorablePanel({
      $data: getQueryRunner(metrics, name),
      pluginId: 'barchart',
      title: `Latency by phase for ${name}`,
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
