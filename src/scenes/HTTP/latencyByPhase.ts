import { SceneQueryRunner } from '@grafana/scenes';
import { DataSourceRef, ThresholdsMode } from '@grafana/schema';

import { ExplorablePanel } from 'scenes/ExplorablePanel';

function getQueryRunner(metrics: DataSourceRef) {
  return new SceneQueryRunner({
    datasource: metrics,
    maxDataPoints: 100,
    queries: [
      {
        expr: 'avg(probe_http_duration_seconds{probe=~"$probe", instance="$instance", job="$job"}) by (phase)',
        instant: false,
        interval: '',
        intervalFactor: 1,
        legendFormat: '{{phase}}',
        refId: 'F',
      },
    ],
  });
}

export function getLatencyByPhasePanel(metrics: DataSourceRef) {
  return new ExplorablePanel({
    pluginId: 'timeseries',
    $data: getQueryRunner(metrics),
    title: 'Response latency by phase: $probe ⮕ $job / $instance',
    fieldConfig: {
      defaults: {
        custom: {
          drawStyle: 'bars',
          fillOpacity: 100,
          stacking: {
            mode: 'normal',
            group: 'A',
          },
        },
        color: {
          mode: 'palette-classic',
        },
        mappings: [],
        thresholds: {
          mode: ThresholdsMode.Absolute,
          steps: [
            {
              value: 0,
              color: 'green',
            },
            {
              value: 80,
              color: 'red',
            },
          ],
        },
        links: [],
      },
      overrides: [],
    },
  });
}
