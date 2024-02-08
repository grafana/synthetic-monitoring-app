import { SceneDataTransformer, SceneQueryRunner } from '@grafana/scenes';
import { DataSourceRef, ThresholdsMode } from '@grafana/schema';

import { ExplorablePanel } from 'scenes/ExplorablePanel';

function getSummaryTableQueryRunner(metrics: DataSourceRef, sm: DataSourceRef) {
  const queryRunner = new SceneQueryRunner({
    datasource: { type: 'datasource', uid: '-- Mixed --' },
    queries: [
      {
        datasource: metrics,
        editorMode: 'code',
        exemplar: false,
        expr: `
          sum by (instance, job, check_name)
          (
            rate(probe_all_success_sum[$__range])
            *
            on (instance, job, probe, config_version) group_left(check_name) max by (instance, job, probe, config_version, check_name) (sm_check_info{check_name=~"$check_type", region=~"$region", $Filters })
          )
          /
          sum by (instance, check_name, job)
          (
            rate(probe_all_success_count[$__range])
            *
            on (instance, job, probe, config_version) group_left(check_name) max by (instance, job, probe, config_version, check_name) (sm_check_info{check_name=~"$check_type", region=~"$region", $Filters })
          )`,
        format: 'table',
        instant: true,
        interval: '',
        legendFormat: '{{check_name}}-{{instance}}-uptime',
        refId: 'reachability',
      },
      {
        datasource: metrics,
        editorMode: 'code',
        exemplar: false,
        expr: `
          sum by (instance, job, check_name)
          (
            rate(probe_all_duration_seconds_sum[$__range])
            *
            on (instance, job, probe, config_version) group_left(check_name) max by (instance, job, probe, config_version, check_name) (sm_check_info{check_name=~"$check_type", region=~"$region", $Filters})
          )
          /
          sum by (instance, job, check_name)
          (
            rate(probe_all_duration_seconds_count[$__range])
            *
            on (instance, job, probe, config_version) group_left(check_name) max by (instance, job, probe, config_version, check_name) (sm_check_info{check_name=~"$check_type", region=~"$region", $Filters})
          )`,
        format: 'table',
        instant: true,
        interval: '',
        legendFormat: '{{check_name}}-{{instance}}-latency',
        refId: 'latency',
      },
      {
        datasource: metrics,
        editorMode: 'code',
        exemplar: false,
        expr: `
          ceil(
            sum by (instance, job, check_name)
            (
              rate(probe_all_success_sum[5m])
              *
              on (instance, job, probe, config_version) group_left(check_name) max by (instance, job, probe, config_version, check_name) (sm_check_info{check_name=~"$check_type", region=~"$region", $Filters})
            )
            /
            sum by (instance, check_name, job)
            (
              rate(probe_all_success_count[5m])
              *
              on (instance, job, probe, config_version) group_left(check_name) max by (instance, job, probe, config_version, check_name) (sm_check_info{check_name=~"$check_type", region=~"$region", $Filters})
            )
          )
        `,
        format: 'table',
        hide: false,
        instant: true,
        interval: '',
        legendFormat: '{{check_name}}-{{instance}}-uptime',
        refId: 'state',
      },
      {
        datasource: metrics,
        editorMode: 'code',
        exemplar: false,
        expr: `
          # find the average uptime over the entire time range evaluating 'up' in 5 minute windows
          avg_over_time(
            (
              # the inner query is going to produce a non-zero value if there was at least one successful check during the 5 minute window
              # so make it a 1 if there was at least one success and a 0 otherwise
              ceil(
                # the number of successes across all probes
                sum by (instance, job) (increase(probe_all_success_sum{}[5m]) * on (instance, job, probe, config_version) sm_check_info{check_name=~"$check_type", $Filters})
                /
                # the total number of times we checked across all probes
                (sum by (instance, job) (increase(probe_all_success_count[5m])) + 1) # + 1 because we want to make sure it goes to 1, not 2
              )
            )
            [$__range:5m]
          )
        `,
        format: 'table',
        hide: false,
        instant: true,
        interval: '',
        legendFormat: '',
        refId: 'uptime',
      },
      {
        datasource: sm,
        hide: false,
        instance: '',
        job: '',
        probe: '',
        queryType: 'checks',
        refId: 'checks',
      },
    ],
  });

  const transformed = new SceneDataTransformer({
    $data: queryRunner,
    transformations: [
      {
        id: 'joinByField',
        options: {
          byField: 'job',
          mode: 'inner',
        },
      },

      {
        id: 'organize',
        options: {
          renameByName: {
            check_name: 'check type',
          },
        },
      },
      {
        id: 'joinByField',
        options: {
          byField: 'instance',
          mode: 'inner',
        },
      },
      {
        id: 'organize',
        options: {
          excludeByName: {
            Time: true,
            Value: false,
            alertSensitivity: true,
            basicMetricsOnly: true,
            check_name: false,
            'check_name 2': true,
            'check_name 3': true,
            created: true,
            enabled: true,
            frequency: true,
            id: false,
            instance: true,
            labels: true,
            modified: true,
            offset: true,
            probes: true,
            settings: true,
            tenantId: true,
            timeout: true,
          },
          indexByName: {
            Time: 0,
            'Value #latency': 7,
            'Value #reachability': 6,
            'Value #state': 4,
            'Value #uptime': 5,
            'check type': 3,
            target: 1,
            job: 2,
          },
          renameByName: {
            target: 'instance',
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
              url: '/a/grafana-synthetic-monitoring-app/checks/${__data.fields.id}/dashboard',
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
              url: '/a/grafana-synthetic-monitoring-app/checks/${__data.fields.id}/dashboard',
            },
          ],
        },
      ],
    },
    {
      matcher: {
        id: 'byName',
        options: 'id',
      },
      properties: [
        {
          id: 'custom.hidden',
          value: true,
        },
      ],
    },
  ];
}

export function getSummaryTable(metrics: DataSourceRef, sm: DataSourceRef) {
  const tablePanel = new ExplorablePanel({
    pluginId: 'table',
    $data: getSummaryTableQueryRunner(metrics, sm),
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
