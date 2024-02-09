import { SceneQueryRunner } from '@grafana/scenes';
import { DataSourceRef, ThresholdsMode } from '@grafana/schema';

import { ExplorablePanel } from 'scenes/ExplorablePanel';

function getErrorPercentageQuery() {
  return `1 - sum(
    rate(
      probe_all_success_sum{probe=~"$probe"}[$__range]) 
      * 
      on (
        instance, job, probe, config_version
      ) 
      group_left
      max(
        sm_check_info{check_name=~"$check_type", region=~"$region", $Filters}
      ) 
      by (instance, job, probe, config_version)
    ) 
    by (job, instance) 
    / 
    sum(
      rate(
        probe_all_success_count{probe=~"$probe"}[$__range]) 
        * 
        on (
          instance, job, probe, config_version
        ) 
        group_left 
        max(
          sm_check_info{check_name=~"$check_type", region=~"$region", $Filters}
        ) 
        by (
          instance, job, probe, config_version
        )
      ) 
    by (job, instance)`;
}

function getErrorPercentageQueryRunner(metrics: DataSourceRef) {
  const queryRunner = new SceneQueryRunner({
    datasource: metrics,
    queries: [
      {
        exemplar: true,
        expr: getErrorPercentageQuery(),
        hide: false,
        legendFormat: '{{job}}/{{ instance }}',
        refId: 'A',
      },
    ],
    // maxDataPoints: 100,
  });
  return queryRunner;
}

export function getErrorPctgTimeseriesPanel(metrics: DataSourceRef) {
  const errorPercentagePanel = new ExplorablePanel({
    pluginId: 'timeseries',
    title: `$check_type check error percentage`,
    fieldConfig: {
      defaults: {
        custom: {
          drawStyle: 'line',
          lineInterpolation: 'linear',
          barAlignment: 0,
          lineWidth: 1,
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
        thresholds: {
          mode: ThresholdsMode.Absolute,
          steps: [
            {
              color: 'green',
              value: 0,
            },
            {
              color: '#EAB839',
              value: 0.5,
            },
            {
              color: 'red',
              value: 1,
            },
          ],
        },
        links: [],
        min: 0,
        max: 1,
        unit: 'percentunit',
      },
      overrides: [],
    },
    options: {
      tooltip: {
        mode: 'single',
        sort: 'none',
      },
      legend: {
        showLegend: true,
        displayMode: 'table',
        placement: 'bottom',
        calcs: [],
      },
    },
    $data: getErrorPercentageQueryRunner(metrics),
  });
  return errorPercentagePanel;
}
