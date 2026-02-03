import React from 'react';
import { CustomTransformOperator, DataFrame, DataTransformerID, Field, MappingType } from '@grafana/data';
import { VizConfigBuilders } from '@grafana/scenes';
import {
  useDataTransformer,
  useQueryRunner,
  useTimeRange,
  useVariables,
  VizPanel,
} from '@grafana/scenes-react';
import {
  TableCellBackgroundDisplayMode,
  TableCellDisplayMode,
  ThresholdsMode,
} from '@grafana/schema';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { useMetricsDS } from 'hooks/useMetricsDS';
import { useSMDS } from 'hooks/useSMDS';
import { DEFAULT_QUERY_FROM_TIME_TEXT } from 'components/constants';
import { useVizPanelMenu } from 'scenes/Common/useVizPanelMenu';

import { getCheckTypeTitle } from './SummaryDashboard.utils';

const FIELD_TRANSFORMATIONS = [
  { from: 'id (lastNotNull)', to: 'id' },
  { from: 'instance', to: 'instance' },
  { from: 'job', to: 'job' },
  { from: 'check_name (lastNotNull)', to: 'check type' },
  { from: 'Value #state (lastNotNull)', to: 'state' },
  { from: 'Value #reach numer (sum) / Value #reach denom (sum)', to: 'reachability' },
  { from: 'Value #latency numer (sum) / Value #latency denom (sum)', to: 'latency' },
];

const CHECK_LINK_URL = '/a/grafana-synthetic-monitoring-app/checks/${__data.fields.id}';

const customOrganize: CustomTransformOperator = () => (source: Observable<DataFrame[]>) => {
  return source.pipe(
    map((data: DataFrame[]) => {
      return data.map((d) => {
        // Build fields in the order defined by FIELD_TRANSFORMATIONS
        const fields = FIELD_TRANSFORMATIONS.map((transformation) => {
          const field = d.fields.find((f) => f.name === transformation.from);
          if (field) {
            return { ...field, name: transformation.to };
          }
          return null;
        }).filter((f): f is Field => f !== null);

        return {
          length: d.length,
          fields,
        };
      });
    })
  );
};

export const SummaryTableViz = () => {
  const metricsDS = useMetricsDS();
  const smDS = useSMDS();
  const [currentTimeRange] = useTimeRange();
  const variables = useVariables();
  const checkTypeVar = variables.find((v) => v.state.name === 'check_type');

  const metricsQueries = metricsDS?.uid
    ? [
      {
        datasource: metricsDS,
        editorMode: 'code',
        expr: ` sum by (instance, job, check_name)
        (
          rate(probe_all_success_sum{probe=~"$probe"}[$__rate_interval])
          *
          on (instance, job, probe, config_version) group_left(check_name) max by (instance, job, probe, config_version, check_name) (sm_check_info{check_name=~"$check_type", region=~"$region", $Filters})
        )`,
        legendFormat: '__auto',
        interval: '1m',
        range: true,
        refId: 'reach numer',
        format: 'table',
      },
      {
        datasource: metricsDS,
        refId: 'reach denom',
        expr: `sum by (instance, check_name, job)
        (
          rate(probe_all_success_count{probe=~"$probe"}[$__rate_interval])
          *
          on (instance, job, probe, config_version) group_left(check_name) max by (instance, job, probe, config_version, check_name) (sm_check_info{check_name=~"$check_type", region=~"$region", $Filters})
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
        datasource: metricsDS,
        refId: 'latency numer',
        expr: `   sum by (instance, job, check_name)
        (
          rate(probe_all_duration_seconds_sum{probe=~"$probe"}[$__rate_interval])
          *
          on (instance, job, probe, config_version) group_left(check_name) max by (instance, job, probe, config_version, check_name) (sm_check_info{check_name=~"$check_type", region=~"$region", $Filters})
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
        datasource: metricsDS,
        refId: 'latency denom',
        expr: ` sum by (instance, job, check_name)
        (
          rate(probe_all_duration_seconds_count{probe=~"$probe"}[$__rate_interval])
          *
          on (instance, job, probe, config_version) group_left(check_name) max by (instance, job, probe, config_version, check_name) (sm_check_info{check_name=~"$check_type", region=~"$region", $Filters})
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
        datasource: metricsDS,
        refId: 'state',
        expr: `ceil(
          sum by (instance, job, check_name)
          (
            rate(probe_all_success_sum{probe=~"$probe"}[5m])
            *
            on (instance, job, probe, config_version) group_left(check_name) max by (instance, job, probe, config_version, check_name) (sm_check_info{check_name=~"$check_type", region=~"$region", $Filters})
          )
          /
          sum by (instance, check_name, job)
          (
            rate(probe_all_success_count{probe=~"$probe"}[5m])
            *
            on (instance, job, probe, config_version) group_left(check_name) max by (instance, job, probe, config_version, check_name) (sm_check_info{check_name=~"$check_type", region=~"$region", $Filters})
          )
        )`,
        range: true,
        instant: false,
        hide: false,
        editorMode: 'code',
        legendFormat: '__auto',
        format: 'table',
      },
    ]
    : [];

  const dataProvider = useQueryRunner({
    datasource: {
      uid: '-- Mixed --',
      type: 'datasource',
    },
    queries: [
      ...metricsQueries,
      {
        refId: 'A',
        hide: false,
        datasource: smDS,
        queryType: 'checks',
        instance: '',
        job: '',
        probe: '',
      },
    ],
  });

  const dataTransformer = useDataTransformer({
    transformations: [
      {
        id: DataTransformerID.renameByRegex,
        options: {
          regex: 'target',
          renamePattern: 'instance',
        },
      },
      {
        id: DataTransformerID.groupBy,
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
        id: DataTransformerID.calculateField,
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
        id: DataTransformerID.joinByField,
        options: {
          byField: 'key',
          mode: 'inner',
        },
      },
      {
        id: DataTransformerID.calculateField,
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
        id: DataTransformerID.calculateField,
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
    data: dataProvider,
  });

  const data = dataProvider.useState();

  const viz = VizConfigBuilders.table()
    .setCustomFieldConfig('cellOptions', { type: TableCellDisplayMode.Auto })
    .setThresholds({
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
    })
    .setColor({
      mode: 'thresholds',
    })
    .setOverrides((b) => {
      return b
        .matchFieldsWithName('reachability')
        .overrideUnit('percentunit')
        .overrideCustomFieldConfig('cellOptions', {
          mode: TableCellBackgroundDisplayMode.Gradient,
          type: TableCellDisplayMode.ColorBackground,
        })
        .overrideThresholds({
          mode: ThresholdsMode.Absolute,
          steps: [
            {
              color: 'red',
              value: 0,
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
        })
        .build();
    })
    .setOverrides((b) => {
      return b
        .matchFieldsWithName('latency')
        .overrideCustomFieldConfig('cellOptions', {
          mode: TableCellBackgroundDisplayMode.Gradient,
          type: TableCellDisplayMode.ColorBackground,
        })
        .overrideThresholds({
          mode: ThresholdsMode.Absolute,
          steps: [
            {
              color: 'green',
              value: 0,
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
        })
        .overrideUnit('s')
        .overrideColor({
          mode: 'thresholds',
        })
        .build();
    })
    .setOverrides((b) => {
      return b
        .matchFieldsWithName('check type')
        .overrideMappings([
          {
            options: {
              dns: {
                text: 'DNS',
              },
              http: {
                text: 'HTTP',
              },
              ping: {
                text: 'PING',
              },
              tcp: {
                text: 'TCP',
              },
              traceroute: {
                text: 'Traceroute',
              },
              grpc: {
                text: 'gRPC',
              },
              k6: {
                text: 'Scripted',
              },
              browser: {
                text: 'Browser',
              },
              'multi-http': {
                text: 'MultiHTTP',
              },
            },
            type: MappingType.ValueToText,
          },
        ])
        .build();
    })
    .setOverrides((b) => {
      return b
        .matchFieldsWithName('state')
        .overrideCustomFieldConfig('cellOptions', {
          mode: TableCellBackgroundDisplayMode.Basic,
          type: TableCellDisplayMode.ColorBackground,
        })
        .overrideMappings([
          {
            options: {
              '0': {
                color: 'red',
                text: 'DOWN',
              },
              '1': {
                color: 'green',
                text: 'UP',
              },
            },
            type: MappingType.ValueToText,
          },
        ])
        .overrideCustomFieldConfig('width', 100)
        .build();
    })
    .setOverrides((b) => {
      return b
        .matchFieldsWithName('uptime')
        .overrideUnit('percentunit')
        .overrideCustomFieldConfig('cellOptions', {
          mode: TableCellBackgroundDisplayMode.Gradient,
          type: TableCellDisplayMode.ColorBackground,
        })
        .overrideThresholds({
          mode: ThresholdsMode.Absolute,
          steps: [
            {
              color: 'red',
              value: 0,
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
        })
        .build();
    })
    .setOverrides((b) => {
      return (
        b
          .matchFieldsWithName('id')
          .overrideCustomFieldConfig('width', 50)
          // @ts-expect-error - hidden is not in TableFieldOptions type but is supported by the table plugin
          .overrideCustomFieldConfig('hidden', true)
          .build()
      );
    })
    .setOverrides((b) => {
      return b.matchFieldsWithName('instance').overrideLinks([{ title: '', url: CHECK_LINK_URL }]).build();
    })
    .setOverrides((b) => {
      return b.matchFieldsWithName('job').overrideLinks([{ title: '', url: CHECK_LINK_URL }]).build();
    })
    .build();

  const menu = useVizPanelMenu({
    data,
    viz,
    currentTimeRange,
    variables: ['probe', 'check_type', 'region', 'Filters'],
  });

  const description = `* instance: the instance that corresponds to this check.
    * **job**: the job that corresponds to this check.
    * **reachability**: the percentage of all the checks that have succeeded during the last ${DEFAULT_QUERY_FROM_TIME_TEXT}.
    * **latency**: the average time to receive an answer across all the checks during the last ${DEFAULT_QUERY_FROM_TIME_TEXT}.
    * **state**: whether the target was up or down the last time it was checked.
    * **uptime**: the fraction of time the target was up during the last ${DEFAULT_QUERY_FROM_TIME_TEXT}.`;

  const title = getCheckTypeTitle(checkTypeVar, ' checks');

  return (
    <VizPanel menu={menu} title={title} description={description} viz={viz} dataProvider={dataTransformer} />
  );
};

