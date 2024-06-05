import { SceneDataTransformer, SceneQueryRunner } from '@grafana/scenes';
import { DataSourceRef, ThresholdsMode } from '@grafana/schema';

import { ExplorablePanel } from 'scenes/ExplorablePanel';

function getSummaryTableQueryRunner(metrics: DataSourceRef, sm: DataSourceRef) {
  const queryRunner = new SceneQueryRunner({
    datasource: {
      uid: '-- Mixed --',
      type: 'datasource',
    },
    queries: [
      {
        datasource: metrics,
        editorMode: 'code',
        expr: ` sum by (instance, job, check_name)
          (
            rate(probe_all_success_sum{probe=~"$probe"}[$__rate_interval])
            *
            on (instance, job, probe, config_version) group_left(check_name) max by (instance, job, probe, config_version, check_name) (sm_check_info{check_name=~"$check_type", region=~"$region", $Filters })
          )`,
        legendFormat: '__auto',
        interval: '1m',
        range: true,
        refId: 'reach numer',
        format: 'table',
      },
      {
        datasource: metrics,
        refId: 'reach denom',
        expr: `sum by (instance, check_name, job)
          (
            rate(probe_all_success_count{probe=~"$probe"}[$__rate_interval])
            *
            on (instance, job, probe, config_version) group_left(check_name) max by (instance, job, probe, config_version, check_name) (sm_check_info{check_name=~"$check_type", region=~"$region", $Filters })
          )`,
        range: true,
        instant: false,
        hide: false,
        interval: '1m',
        editorMode: 'code',
        legendFormat: '__auto',
        format: 'table',
      },
      {
        datasource: metrics,
        refId: 'latency numer',
        expr: `   sum by (instance, job, check_name)
          (
            rate(probe_all_duration_seconds_sum{probe=~"$probe"}[$__rate_interval])
            *
            on (instance, job, probe, config_version) group_left(check_name) max by (instance, job, probe, config_version, check_name) (sm_check_info{check_name=~"$check_type", region=~"$region", $Filters })
          )`,
        range: true,
        instant: false,
        hide: false,
        interval: '1m',
        editorMode: 'code',
        legendFormat: '__auto',
        format: 'table',
      },
      {
        datasource: metrics,
        refId: 'latency denom',
        expr: ` sum by (instance, job, check_name)
          (
            rate(probe_all_duration_seconds_count{probe=~"$probe"}[$__rate_interval])
            *
            on (instance, job, probe, config_version) group_left(check_name) max by (instance, job, probe, config_version, check_name) (sm_check_info{check_name=~"$check_type", region=~"$region", $Filters })
          )`,
        range: true,
        instant: false,
        hide: false,
        interval: '1m',
        editorMode: 'code',
        legendFormat: '__auto',
        format: 'table',
      },
      {
        datasource: metrics,
        refId: 'state',
        expr: `ceil(
            sum by (instance, job, check_name)
            (
              rate(probe_all_success_sum{probe=~"$probe"}[5m])
              *
              on (instance, job, probe, config_version) group_left(check_name) max by (instance, job, probe, config_version, check_name) (sm_check_info{check_name=~"$check_type", region=~"$region", $Filters })
            )
            /
            sum by (instance, check_name, job)
            (
              rate(probe_all_success_count{probe=~"$probe"}[5m])
              *
              on (instance, job, probe, config_version) group_left(check_name) max by (instance, job, probe, config_version, check_name) (sm_check_info{check_name=~"$check_type", region=~"$region", $Filters })
            )
          )`,
        range: true,
        instant: false,
        hide: false,
        editorMode: 'code',
        legendFormat: '__auto',
        format: 'table',
      },
      {
        refId: 'A',
        hide: false,
        datasource: sm,
        queryType: 'checks',
        instance: '',
        job: '',
        probe: '',
      },
    ],
  });

  const transformed = new SceneDataTransformer({
    $data: queryRunner,
    transformations: [
      {
        id: 'groupBy',
        options: {
          fields: {
            'Value #A': {
              aggregations: ['sum'],
              operation: 'aggregate',
            },
            'Value #latency denom': {
              aggregations: ['sum'],
              operation: 'aggregate',
            },
            'Value #latency numer': {
              aggregations: ['sum'],
              operation: 'aggregate',
            },
            'Value #reach denom': {
              aggregations: ['sum'],
              operation: 'aggregate',
            },
            'Value #reach numer': {
              aggregations: ['sum'],
              operation: 'aggregate',
            },
            'Value #state': {
              aggregations: ['lastNotNull'],
              operation: 'aggregate',
            },
            check_name: {
              aggregations: ['lastNotNull'],
              operation: 'aggregate',
            },
            id: {
              aggregations: ['lastNotNull'],
              operation: 'aggregate',
            },
            instance: {
              aggregations: [],
              operation: 'groupby',
            },
            job: {
              aggregations: [],
              operation: 'groupby',
            },
          },
        },
      },
      {
        "id": "calculateField",
        "options": {
          "mode": "binary",
          "reduce": {
            "reducer": "sum"
          },
          "binary": {
            "left": "instance",
            "right": "job"
          },
          "alias": "key",
          "replaceFields": false
        }
      },
      {
        "id": "joinByField",
        "options": {
          "byField": "key",
          "mode": "inner"
        }
      },
      {
        id: 'calculateField',
        options: {
          mode: 'binary',
          reduce: {
            reducer: 'sum',
          },
          alias: '',
          binary: {
            left: 'Value #reach numer (sum)',
            operator: '/',
            right: 'Value #reach denom (sum)',
          },
        },
      },
      {
        id: 'calculateField',
        options: {
          mode: 'binary',
          reduce: {
            reducer: 'sum',
          },
          alias: '',
          binary: {
            left: 'Value #latency numer (sum)',
            operator: '/',
            right: 'Value #latency denom (sum)',
          },
        },
      },
      {
        id: 'organize',
        options: {
          excludeByName: {
            "key": true,
            'Value #A (sum)': true,
            'Value #latency denom (sum)': true,
            'Value #latency numer (sum)': true,
            'Value #reach denom (sum)': true,
            'Value #reach numer (sum)': true,
            'check_name (lastNotNull) 2': true,
            'check_name (lastNotNull) 3': true,
            'check_name (lastNotNull) 4': true,
            'check_name (lastNotNull) 5': true,
            'id (lastNotNull)': false,
            'job 2': true,
            'job 3': true,
            'job 4': true,
            'job 5': true,
            'instance 2': true,
            'instance 3': true,
            'instance 4': true,
            'instance 5': true,
            'instance 6': true,
          },
          indexByName: {
            'Value #latency denom (sum)': 16,
            'Value #latency numer (sum)': 13,
            'Value #reach denom (sum)': 10,
            'Value #reach numer (sum)': 7,
            'Value #state (lastNotNull)': 3,
            'Value #uptime (mean)': 4,
            'check_name (lastNotNull)': 2,
            'check_name (lastNotNull) 1': 2,
            'check_name (lastNotNull) 2': 9,
            'check_name (lastNotNull) 3': 12,
            'check_name (lastNotNull) 4': 15,
            'check_name (lastNotNull) 5': 19,
            'id (lastNotNull)': 20,
            'instance 1': 1,
            'instance 2': 8,
            'instance 3': 11,
            'instance 4': 14,
            'instance 5': 17,
            'instance 6': 18,
            'job 1': 0,
            latency: 6,
            reachability: 5,
            'Value #reach numer (sum) / Value #reach denom (sum)': 5,
            'Value #latency numer (sum) / Value #latency denom (sum)': 6,
          },
          renameByName: {
            'Value #state (lastNotNull)': 'state',
            'Value #uptime (mean)': 'uptime',
            'check_name (lastNotNull)': 'check type',
            'check_name (lastNotNull) 1': 'check type',
            'id (lastNotNull)': 'id',
            'Value #reach numer (sum) / Value #reach denom (sum)': 'reachability',
            'Value #latency numer (sum) / Value #latency denom (sum)': 'latency',
          },
          includeByName: {},
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
        options: 'reachability',
      },
      properties: [
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
                color: 'yellow',
                value: 0.9,
              },
              {
                color: 'green',
                value: 0.99,
              },
            ],
          },
        },
      ],
    },
    {
      matcher: {
        id: 'byName',
        options: 'latency',
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
        options: 'check type',
      },
      properties: [
        {
          id: 'mappings',
          value: [
            {
              options: {
                k6: {
                  index: 0,
                  text: 'scripted',
                },
              },
              type: 'value',
            },
          ],
        },
      ],
    },
    {
      matcher: {
        id: 'byName',
        options: 'state',
      },
      properties: [
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
        options: 'uptime',
      },
      properties: [
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
    description: `* instance: the instance that corresponds to this check.
    * **job**: the job that corresponds to this check.
    * **reachability**: the percentage of all the checks that have succeeded during the whole time period.
    * **latency**: the average time to receive an answer across all the checks during the whole time period.
    * **state**: whether the target was up or down the last time it was checked.
    * **uptime**: the fraction of time the target was up  during the whole period.`,

    fieldConfig: {
      defaults: {
        custom: {
          align: 'auto',
          cellOptions: {
            type: 'auto',
          },
          inspect: false,
          filterable: false,
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
        color: {
          mode: 'thresholds',
        },
      },
      overrides: getFieldOverrides(),
    },
  });
  return tablePanel;
}
