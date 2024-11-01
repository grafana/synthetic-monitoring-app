import { CustomTransformOperator, DataFrame, Field } from '@grafana/data';
import { SceneDataTransformer, SceneQueryRunner } from '@grafana/scenes';
import { DataSourceRef, ThresholdsMode } from '@grafana/schema';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ExplorablePanel } from 'scenes/ExplorablePanel';

function getSummaryTableQueryRunner(metrics: DataSourceRef, sm: DataSourceRef) {
  const metricsQueries = [
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
  ];

  const queryRunner = new SceneQueryRunner({
    datasource: {
      uid: '-- Mixed --',
      type: 'datasource',
    },
    queries: [
      ...(metrics?.uid ? metricsQueries : []),
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
        id: 'renameByRegex',
        options: {
          regex: 'target',
          renamePattern: 'instance',
        },
      },
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
        id: 'calculateField',
        options: {
          mode: 'binary',
          reduce: {
            reducer: 'sum',
          },
          binary: {
            left: 'instance',
            right: 'job',
          },
          alias: 'key',
          replaceFields: false,
        },
      },
      {
        id: 'joinByField',
        options: {
          byField: 'key',
          mode: 'inner',
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
      customOrganize,
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
              url: '/a/grafana-synthetic-monitoring-app/checks/${__data.fields.id}',
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
              url: '/a/grafana-synthetic-monitoring-app/checks/${__data.fields.id}',
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

const FIELD_TRANSFORMATIONS = [
  { from: 'job', to: 'job' },
  { from: 'instance', to: 'instance' },
  { from: 'id (lastNotNull)', to: 'id' },
  { from: 'check_name (lastNotNull)', to: 'check type' },
  { from: 'Value #state (lastNotNull)', to: 'state' },
  { from: 'Value #reach numer (sum) / Value #reach denom (sum)', to: 'reachability' },
  { from: 'Value #latency numer (sum) / Value #latency denom (sum)', to: 'latency' },
];

const customOrganize: CustomTransformOperator = () => (source: Observable<DataFrame[]>) => {
  return source.pipe(
    map((data: DataFrame[]) => {
      return data.map((d) => {
        const fields = d.fields.reduce<Field[]>((acc, f) => {
          const fieldName = f.name;
          const toKeep = FIELD_TRANSFORMATIONS.find((t) => t.from === fieldName);
          const alreadyExists = acc.find((a) => a.name === toKeep?.to);

          if (toKeep && !alreadyExists) {
            return [...acc, { ...f, name: toKeep.to }];
          }

          return acc;
        }, []);

        return {
          length: d.length,
          fields,
        };
      });
    })
  );
};
