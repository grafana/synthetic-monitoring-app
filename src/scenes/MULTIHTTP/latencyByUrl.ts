import { SceneFlexItem, SceneQueryRunner } from '@grafana/scenes';
import { DataSourceRef } from '@grafana/schema';

import { ExplorablePanel } from 'scenes/ExplorablePanel';

function getQueryRunner(metrics: DataSourceRef) {
  return new SceneQueryRunner({
    datasource: metrics,
    queries: [
      {
        refId: 'A',
        expr: 'sum by (probe) (probe_http_total_duration_seconds{probe=~"$probe", job="$job", instance="$instance", name="$activeStepIndex", method="$stepMethod"})',
        range: true,
        instant: false,
        legendFormat: '__auto',
        editorMode: 'code',
      },
    ],
  });
}

export function getLatencyByUrlPanel(metrics: DataSourceRef) {
  const query = getQueryRunner(metrics);
  return new SceneFlexItem({
    body: new ExplorablePanel({
      $data: query,
      pluginId: 'timeseries',
      title: 'Latency for $stepUrl',
      fieldConfig: {
        defaults: {
          custom: {
            drawStyle: 'line',
            lineInterpolation: 'linear',
            barAlignment: 0,
            lineWidth: 1,
            fillOpacity: 0,
            gradientMode: 'none',
            spanNulls: false,
            showPoints: 'auto',
            pointSize: 5,
            stacking: {
              mode: 'none',
              group: 'A',
            },
            axisPlacement: 'auto',
            axisLabel: '',
            axisColorMode: 'text',
            scaleDistribution: {
              type: 'linear',
            },
            axisCenteredZero: false,
            hideFrom: {
              tooltip: false,
              viz: false,
              legend: false,
            },
            thresholdsStyle: {
              mode: 'off',
            },
          },
          color: {
            mode: 'palette-classic',
          },
          mappings: [],
          unit: 's',
        },
        overrides: [],
      },
    }),
  });
}
