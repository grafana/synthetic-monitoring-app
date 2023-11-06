import { SceneDataTransformer, SceneQueryRunner } from '@grafana/scenes';
import { DataSourceRef, ThresholdsMode } from '@grafana/schema';

import { ExplorablePanel } from 'scenes/ExplorablePanel';

function getSummaryTableQueryRunner(metrics: DataSourceRef) {
  const queryRunner = new SceneQueryRunner({
    datasource: metrics,
    queries: [
      {
        editorMode: 'code',
        exemplar: false,
        expr: 'sum by (instance, job, check_name)\n(\n  rate(probe_all_success_sum[$__range])\n  *\n  on (instance, job, probe, config_version)\n  group_left(check_name)\n  max\n  by (instance, job, probe, config_version, check_name)\n  (sm_check_info{check_name=~"$check_type", region=~"$region"})\n)\n/\nsum by (instance, check_name, job)\n(\n  rate(probe_all_success_count[$__range])\n  *\n  on (instance, job, probe, config_version)\n  group_left(check_name)\n  max\n  by (instance, job, probe, config_version, check_name)\n  (sm_check_info{check_name=~"$check_type", region=~"$region"})\n)',
        format: 'table',
        instant: true,
        interval: '',
        legendFormat: '{{check_name}}-{{instance}}-uptime',
        refId: 'reachability',
      },
      {
        editorMode: 'code',
        exemplar: false,
        expr: 'sum by (instance, job, check_name)\n(\n  rate(probe_all_duration_seconds_sum[$__range])\n  * \n  on (instance, job, probe, config_version)\n  group_left(check_name)\n  max by (instance, job, probe, config_version, check_name)\n  (sm_check_info{check_name=~"$check_type", region=~"$region"})\n)\n/\nsum by (instance, job, check_name)\n(\n  rate(probe_all_duration_seconds_count[$__range])\n  *\n  on (instance, job, probe, config_version)\n  group_left(check_name)\n  max by (instance, job, probe, config_version, check_name)\n  (sm_check_info{check_name=~"$check_type", region=~"$region"})\n)',
        format: 'table',
        instant: true,
        interval: '',
        legendFormat: '{{check_name}}-{{instance}}-latency',
        refId: 'latency',
      },
      {
        editorMode: 'code',
        exemplar: false,
        expr: 'ceil(\n  sum by (instance, job, check_name)\n  (\n  rate(probe_all_success_sum[5m])\n  *\n  on (instance, job, probe, config_version)\n    group_left(check_name)\n    max\n    by (instance, job, probe, config_version, check_name)\n    (sm_check_info{check_name=~"$check_type", region=~"$region"})\n  )\n  /\n  sum by (instance, check_name, job)\n  (\n    rate(probe_all_success_count[5m])\n  *\n    on (instance, job, probe, config_version)\n    group_left(check_name)\n    max\n    by (instance, job, probe, config_version, check_name)\n    (sm_check_info{check_name=~"$check_type", region=~"$region"})\n  )\n)',
        format: 'table',
        hide: false,
        instant: true,
        interval: '',
        legendFormat: '{{check_name}}-{{instance}}-uptime',
        refId: 'state',
      },
      {
        editorMode: 'code',
        exemplar: false,
        expr: '# find the average uptime over the entire time range evaluating \'up\' in 5 minute windows\navg_over_time(\n  (\n    # the inner query is going to produce a non-zero value if there was at least one successful check during the 5 minute window\n    # so make it a 1 if there was at least one success and a 0 otherwise\n    ceil(\n      # the number of successes across all probes\n      sum by (instance, job) (increase(probe_all_success_sum{}[5m]) * on (instance, job, probe, config_version) sm_check_info{check_name=~"$check_type"})\n      /\n      # the total number of times we checked across all probes\n      (sum by (instance, job) (increase(probe_all_success_count[5m])) + 1) # + 1 because we want to make sure it goes to 1, not 2\n    )\n  )\n  [$__range:5m]\n)',
        format: 'table',
        hide: false,
        instant: true,
        interval: '',
        legendFormat: '',
        refId: 'uptime',
      },
    ],
  });

  const transformed = new SceneDataTransformer({
    $data: queryRunner,
    transformations: [
      {
        id: 'merge',
        options: {},
      },
      {
        id: 'organize',
        options: {
          excludeByName: {
            Time: true,
            check_name: false,
          },
          indexByName: {
            Time: 0,
            'Value #latency': 7,
            'Value #reachability': 6,
            'Value #state': 4,
            'Value #uptime': 5,
            check_name: 3,
            instance: 1,
            job: 2,
          },
          renameByName: {
            check_name: 'check type',
          },
        },
      },
    ],
  });
  return transformed;
}

function getFieldOverrides() {
  return [
    {
      matcher: {
        id: 'byName',
        options: 'Value #reachability',
      },
      properties: [
        {
          id: 'custom.cellOptions',
          value: {
            mode: 'gradient',
            type: 'color-background',
          },
        },
        {
          id: 'unit',
          value: 'percentunit',
        },
        {
          id: 'displayName',
          value: 'reachability',
        },
      ],
    },
    {
      matcher: {
        id: 'byName',
        options: 'Value #latency',
      },
      properties: [
        {
          id: 'custom.cellOptions',
          value: {
            mode: 'gradient',
            type: 'color-background',
          },
        },
        {
          id: 'displayName',
          value: 'latency',
        },
        {
          id: 'thresholds',
          value: {
            mode: 'absolute',
            steps: [
              {
                color: 'green',
                value: null,
              },
              {
                color: 'yellow',
                value: 0.5,
              },
              {
                color: 'red',
                value: 1,
              },
            ],
          },
        },
        {
          id: 'unit',
          value: 's',
        },
        {
          id: 'color',
          value: {
            mode: 'thresholds',
          },
        },
      ],
    },
    {
      matcher: {
        id: 'byName',
        options: 'Value #state',
      },
      properties: [
        {
          id: 'displayName',
          value: 'state',
        },
        {
          id: 'mappings',
          value: [
            {
              options: {
                '0': {
                  text: 'down',
                },
                '1': {
                  text: 'up',
                },
              },
              type: 'value',
            },
          ],
        },
        {
          id: 'custom.cellOptions',
          value: {
            mode: 'gradient',
            type: 'color-background',
          },
        },
        {
          id: 'thresholds',
          value: {
            mode: 'absolute',
            steps: [
              {
                color: 'red',
                value: null,
              },
              {
                color: 'green',
                value: 1,
              },
            ],
          },
        },
        {
          id: 'color',
        },
      ],
    },
    {
      matcher: {
        id: 'byName',
        options: 'Value #uptime',
      },
      properties: [
        {
          id: 'displayName',
          value: 'uptime',
        },
        {
          id: 'unit',
          value: 'percentunit',
        },
        {
          id: 'custom.cellOptions',
          value: {
            mode: 'gradient',
            type: 'color-background',
          },
        },
      ],
    },
    {
      matcher: {
        id: 'byName',
        options: 'instance',
      },
      properties: [
        {
          id: 'links',
          value: [
            {
              title: 'Show details...',
              url: '/a/grafana-synthetic-monitoring-app/scene/${__data.fields.check_type}?var-probe=All&var-instance=${__data.fields.instance}&var-job=${__data.fields.job}&from=${__from}&to=${__to}',
            },
          ],
        },
      ],
    },
    {
      matcher: {
        id: 'byName',
        options: 'job',
      },
      properties: [
        {
          id: 'links',
          value: [
            {
              title: 'Show details...',
              url: '/a/grafana-synthetic-monitoring-app/scene/?var-probe=All&var-instance=${__data.fields.instance}&var-job=${__data.fields.job}&from=${__from}&to=${__to}',
            },
          ],
        },
      ],
    },
  ];
}

export function getSummaryTable(metrics: DataSourceRef) {
  const tablePanel = new ExplorablePanel({
    pluginId: 'table',
    $data: getSummaryTableQueryRunner(metrics),
    title: `$check_type checks`,
    description:
      '* instance: the instance that corresponds to this check.\n* **job**: the job that corresponds to this check.\n* **reachability**: the percentage of all the checks that have succeeded during the whole time period.\n* **latency**: the average time to receive an answer across all the checks during the whole time period.\n* **state**: whether the target was up or down the last time it was checked.\n* **uptime**: the fraction of time the target was up  during the whole period.',
    fieldConfig: {
      defaults: {
        color: {
          mode: 'thresholds',
        },
        custom: {
          cellOptions: {
            type: 'auto',
          },
          filterable: false,
          inspect: false,
        },
        mappings: [],
        thresholds: {
          mode: ThresholdsMode.Absolute,
          steps: [
            {
              color: 'red',
              value: 0,
            },
            {
              color: '#EAB839',
              value: 0.5,
            },
            {
              color: 'green',
              value: 1,
            },
          ],
        },
      },
      overrides: getFieldOverrides(),
    },
  });
  return tablePanel;
}
