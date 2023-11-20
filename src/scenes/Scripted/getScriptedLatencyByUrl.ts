import { SceneQueryRunner } from '@grafana/scenes';
import { DataSourceRef } from '@grafana/schema';

import { Check } from 'types';
import { ExplorablePanel } from 'scenes/ExplorablePanel';

function getQueryRunner(metrics: DataSourceRef, check?: Check) {
  return new SceneQueryRunner({
    datasource: metrics,
    queries: [
      {
        refId: 'A',
        expr: `sum by (url) (probe_http_total_duration_seconds{job="${check?.job}", instance="${check?.target}"})`,
        range: true,
        instant: false,
        legendFormat: '__auto',
        editorMode: 'code',
      },
    ],
  });
}

export function getScriptedLatencyByUrl(metrics: DataSourceRef, check?: Check) {
  const query = getQueryRunner(metrics, check);
  return new ExplorablePanel({
    $data: query,
    pluginId: 'timeseries',
    title: 'Latency by url',
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
  });
}
