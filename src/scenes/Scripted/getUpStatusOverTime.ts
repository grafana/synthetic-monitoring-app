import { SceneQueryRunner } from '@grafana/scenes';
import { DataSourceRef, ThresholdsMode } from '@grafana/schema';

import { ExplorablePanel } from 'scenes/ExplorablePanel';

function getQueryRunner(metrics: DataSourceRef) {
  return new SceneQueryRunner({
    datasource: metrics,
    queries: [
      {
        expr: `
          ceil(
            sum by (probe)
            (
              rate(probe_all_success_sum{instance="$instance", job="$job", probe=~".*"}[5m])
              *
              on (instance, job, probe, config_version) group_left(check_name) max by (instance, job, probe, config_version, check_name) (sm_check_info{check_name=~"k6" })
            )
            /
            sum by (probe)
            (
              rate(probe_all_success_count{instance="$instance", job="$job", probe=~".*"}[5m])
              *
              on (instance, job, probe, config_version) group_left(check_name) max by (instance, job, probe, config_version, check_name) (sm_check_info{check_name=~"k6" })
            )
          )
        `,
        format: 'table',
        hide: false,
        instant: false,
        interval: '',
        legendFormat: '{{check_name}}-{{instance}}-uptime',
        refId: 'stateOverTime',
      },
    ],
  });
}

export function getUpStatusOverTime(metrics: DataSourceRef) {
  return new ExplorablePanel({
    pluginId: 'timeseries',
    title: 'State over time',
    description: 'Whether check was up or down over time',
    $data: getQueryRunner(metrics),
    fieldConfig: {
      defaults: {
        decimals: 2,
        max: 1,
        thresholds: {
          mode: ThresholdsMode.Absolute,
          steps: [
            {
              color: 'red',
              value: 0,
            },
            {
              color: '#EAB839',
              value: 0.99,
            },
            {
              color: 'green',
              value: 0.995,
            },
          ],
        },
        unit: 'percentunit',
      },
      overrides: [],
    },

    options: {
      colorMode: 'value',
      fieldOptions: {
        calcs: ['lastNotNull'],
      },
      graphMode: 'none',
      justifyMode: 'auto',
      orientation: 'horizontal',
      reduceOptions: {
        calcs: ['mean'],
        fields: '',
        values: false,
      },
      text: {},
      textMode: 'auto',
    },
  });
}
