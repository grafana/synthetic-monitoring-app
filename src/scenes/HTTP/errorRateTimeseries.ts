import { SceneQueryRunner } from '@grafana/scenes';
import { DataSourceRef } from '@grafana/schema';

import { ExplorablePanel } from 'scenes/ExplorablePanel';

const query = `
    1 - (
      sum by (probe) (
        rate(probe_all_success_sum{probe=~"$probe", instance="$instance", job="$job"}[$__rate_interval])
      )
      /
      sum by (probe) (
        rate(probe_all_success_count{probe=~"$probe", instance="$instance", job="$job"}[$__rate_interval])
      )
    )
`;

function getQueryRunner(metrics: DataSourceRef, minStep: string) {
  return new SceneQueryRunner({
    datasource: metrics,
    queries: [
      {
        exemplar: true,
        expr: query,
        hide: false,
        interval: minStep,
        intervalFactor: 1,
        legendFormat: '{{ probe }}',
        refId: 'errorRate',
      },
    ],
  });
}

export function getErrorRateTimeseries(metrics: DataSourceRef, minStep: string) {
  return new ExplorablePanel({
    pluginId: 'timeseries',
    title: 'Error Rate : $probe ⮕ $job / $instance',
    $data: getQueryRunner(metrics, minStep),
    options: {
      yaxes: [
        {
          format: 'percent',
        },
      ],
    },
    fieldConfig: {
      defaults: {
        max: 1,
        unit: 'percentunit',
        custom: {
          drawStyle: 'line',
          lineInterpolation: 'linear',
          barAlignment: 0,
          lineWidth: 3,
          fillOpacity: 16,
          gradientMode: 'none',
          spanNulls: true,
          insertNulls: false,
          showPoints: 'always',
          pointSize: 5,
          stacking: {
            mode: 'none',
            group: 'A',
          },
          axisPlacement: 'auto',
          axisLabel: '',
          axisColorMode: 'text',
          axisBorderShow: false,
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
      },
      overrides: [],
    },
  });
}
