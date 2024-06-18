import { SceneQueryRunner } from '@grafana/scenes';
import { DataSourceRef } from '@grafana/schema';

import { ExplorablePanel } from 'scenes/ExplorablePanel';

function getLatencyQueryRunner(metrics: DataSourceRef) {
  const queryRunner = new SceneQueryRunner({
    datasource: {
      uid: '-- Mixed --',
      type: 'datasource',
    },
    queries: [
      {
        datasource: metrics,
        expr: `
        (
          sum(
            rate(probe_all_duration_seconds_sum{probe=~"$probe"}[$__rate_interval])
            * on (instance, job, probe, config_version) group_left max(sm_check_info{check_name=~"$check_type", region=~"$region", $Filters})
            by (instance, job, probe, config_version)
          )
          by (job, instance)
        )
        /
        (
          sum(
            rate(probe_all_duration_seconds_count{probe=~"$probe"}[$__rate_interval])
            * on (instance, job, probe, config_version) group_left max(sm_check_info{check_name=~"$check_type", region=~"$region", $Filters})
            by (instance, job, probe, config_version)
          )
          by (job, instance)
        )
        `,
        hide: false,
        interval: '1m',
        legendFormat: '{{job}}/{{ instance }}',
        refId: 'A',
      },
    ],
  });
  return queryRunner;
}

export function getLatencyTimeseriesPanel(metrics: DataSourceRef) {
  const latencyPanel = new ExplorablePanel({
    pluginId: 'timeseries',
    title: `$check_type latency`,
    $data: getLatencyQueryRunner(metrics),
    fieldConfig: {
      defaults: {
        custom: {
          drawStyle: 'line',
          lineInterpolation: 'linear',
          barAlignment: 0,
          lineWidth: 2,
          fillOpacity: 0,
          gradientMode: 'none',
          spanNulls: true,
          insertNulls: false,
          showPoints: 'never',
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
        color: {
          mode: 'palette-classic',
        },
        mappings: [],
        links: [],
        min: 0,
        unit: 's',
      },
      overrides: [],
    },
    options: {
      tooltip: {
        mode: 'multi',
        sort: 'none',
      },
      legend: {
        showLegend: true,
        displayMode: 'table',
        placement: 'bottom',
        calcs: [],
      },
    },
  });
  return latencyPanel;
}
