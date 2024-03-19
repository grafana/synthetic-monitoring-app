import { SceneDataTransformer, SceneQueryRunner } from '@grafana/scenes';
import { DataSourceRef, ThresholdsMode } from '@grafana/schema';

import { UPTIME_DESCRIPTION } from 'components/constants';
import { ExplorablePanel } from 'scenes/ExplorablePanel';

function getQueryRunner(metrics: DataSourceRef) {
  const runner = new SceneQueryRunner({
    datasource: metrics,
    queries: [
      {
        editorMode: 'code',
        exemplar: false,
        expr: 'sum by (instance, job) (increase(probe_all_success_sum{instance="$instance", job="$job"}[5m]))\n',
        hide: false,
        instant: false,
        interval: '',
        legendFormat: 'numerator',
        range: true,
        refId: 'B',
        format: 'table',
      },
      {
        refId: 'A',
        expr: '(sum by (instance, job) (increase(probe_all_success_count{instance="$instance", job="$job"}[5m])) + 1) # + 1 because we want to make sure it goes to 1, not 2',
        range: true,
        instant: false,
        hide: false,
        editorMode: 'code',
        legendFormat: 'denominator',
        interval: '',
        format: 'table',
      },
    ],
  });

  return new SceneDataTransformer({
    $data: runner,
    transformations: [
      {
        id: 'joinByField',
        options: {
          reduceOptions: {
            values: false,
            calcs: ['mean'],
            fields: '/^uptime$/',
            limit: 1,
          },
          orientation: 'horizontal',
          textMode: 'auto',
          wideLayout: true,
          colorMode: 'value',
          graphMode: 'none',
          justifyMode: 'auto',
          showPercentChange: false,
          fieldOptions: {
            calcs: ['lastNotNull'],
          },
          text: {},
        },
      },
      {
        id: 'groupBy',
        options: {
          fields: {
            'Value #B': {
              aggregations: ['sum'],
              operation: 'aggregate',
            },
            'Value #A': {
              aggregations: ['sum'],
              operation: 'aggregate',
            },
            Time: {
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
            left: 'Value #B (sum)',
            operator: '/',
            right: 'Value #A (sum)',
          },
          replaceFields: true,
        },
      },
      {
        id: 'calculateField',
        options: {
          mode: 'unary',
          reduce: {
            reducer: 'sum',
          },
          unary: {
            operator: 'ceil',
            fieldName: 'Value #B (sum) / Value #A (sum)',
          },
          replaceFields: true,
          alias: 'uptime',
        },
      },
    ],
  });
}

export function getUptimeStat(metrics: DataSourceRef) {
  return new ExplorablePanel({
    pluginId: 'stat',
    title: 'Uptime',
    description: UPTIME_DESCRIPTION,
    $data: getQueryRunner(metrics),
    fieldConfig: {
      defaults: {
        decimals: 2,
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
