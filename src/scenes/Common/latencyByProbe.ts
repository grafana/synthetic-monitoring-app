import { SceneQueryRunner } from '@grafana/scenes';
import { DataSourceRef, StackingMode, ThresholdsMode } from '@grafana/schema';
import { DrawStyle } from '@grafana/ui';

import { ExplorablePanel } from 'scenes/ExplorablePanel';

function getQueryRunner(metrics: DataSourceRef) {
  return new SceneQueryRunner({
    datasource: metrics,
    queries: [
      {
        expr: 'avg(probe_duration_seconds{probe=~"$probe", instance="$instance", job="$job"} * on (instance, job,probe,config_version) group_left probe_success{probe=~"$probe",instance="$instance", job="$job"} > 0) by (probe)',
        instant: false,
        interval: '',
        intervalFactor: 1,
        legendFormat: '{{probe}}',
        refId: 'A',
      },
    ],
  });
}

export function getLatencyByProbePanel(metrics: DataSourceRef) {
  return new ExplorablePanel({
    pluginId: 'timeseries',
    $data: getQueryRunner(metrics),
    title: 'Response latency by probe',
    fieldConfig: {
      defaults: {
        custom: {
          drawStyle: 'points',
          lineInterpolation: 'linear',
          barAlignment: 0,
          lineWidth: 0,
          fillOpacity: 100,
          gradientMode: 'none',
          spanNulls: false,
          showPoints: 'always',
          pointSize: 4,
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
        unit: 's',
      },
      overrides: [],
    },
    options: {
      drawStyle: DrawStyle.Points,
      // lineInterpolation: 'linear',
      // barAlignment: 0,
      // lineWidth: 0,
      // fillOpacity: 100,
      // gradientMode: 'none',
      // spanNulls: false,
      // showPoints: 'always',
      pointSize: 4,
      stacking: StackingMode.None,
      //   group: 'A',
      // },
      // axisPlacement: 'auto',
      // axisLabel: '',
      // axisColorMode: 'text',
      // scaleDistribution: {
      //   type: 'linear',
      // },
      // axisCenteredZero: false,
      // hideFrom: {
      //   tooltip: false,
      //   viz: false,
      //   legend: false,
      // },
      // thresholdsStyle: {
      //   mode: 'off',
      // },
      // xTickLabelRotation: 0,
      xTickLabelSpacing: 100,
      tooltip: {
        mode: 'multi',
        sort: 'none',
      },
      legend: {
        showLegend: true,
        displayMode: 'table',
        placement: 'right',
        calcs: ['mean', 'lastNotNull'],
      },
    },
  });
}
