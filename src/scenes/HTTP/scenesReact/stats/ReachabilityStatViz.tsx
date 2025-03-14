import React from 'react';
import { VizConfigBuilders } from '@grafana/scenes';
import { useDataTransformer, useQueryRunner, useTimeRange, VizPanel } from '@grafana/scenes-react';
import { BigValueGraphMode, ThresholdsMode } from '@grafana/schema';

import { useMetricsDS } from 'hooks/useMetricsDS';
import { REACHABILITY_DESCRIPTION } from 'components/constants';

import { useVizPanelMenu } from '../useVizPanelMenu';

export const ReachabilityStat = ({ minStep }: { minStep: string }) => {
  const metricsDS = useMetricsDS();

  const queries = [
    {
      expr: `sum(rate(probe_all_success_sum{instance="$instance", job="$job", probe=~".*"}[$__rate_interval]))`,
      hide: false,
      instant: false,
      legendFormat: 'sum',
      interval: minStep,
      range: true,
      refId: 'A',
    },
    {
      exemplar: true,
      expr: `sum(rate(probe_all_success_count{instance="$instance", job="$job", probe=~".*"}[$__rate_interval]))`,
      hide: false,
      instant: false,
      interval: minStep,
      legendFormat: 'count',
      range: true,
      refId: 'B',
    },
  ];

  const dataProvider = useQueryRunner({
    queries,
    datasource: metricsDS,
  });

  const dataTransformer = useDataTransformer({
    transformations: [
      {
        id: 'reduce',
        options: {
          labelsToFields: false,
          reducers: ['sum'],
        },
      },
      {
        id: 'rowsToFields',
        options: {
          mappings: [
            {
              fieldName: 'Total',
              handlerKey: 'field.value',
            },
          ],
        },
      },
      {
        id: 'calculateField',
        options: {
          binary: {
            left: 'sum',
            operator: '/',
            right: 'count',
          },
          mode: 'binary',
          reduce: {
            reducer: 'sum',
          },
        },
      },
      {
        id: 'organize',
        options: {
          excludeByName: {
            count: true,
            sum: true,
          },
          includeByName: {},
          indexByName: {},
          renameByName: {},
        },
      },
    ],
    data: dataProvider,
  });

  const viz = VizConfigBuilders.stat()
    .setOption('graphMode', BigValueGraphMode.None)
    .setUnit('percentunit')
    .setDecimals(2)
    .setMin(0)
    .setMax(1)
    .setNoValue('N/A')
    .setThresholds({
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
    })
    .build();

  const data = dataProvider.useState();
  const [currentTimeRange] = useTimeRange();

  const menu = useVizPanelMenu({
    //@ts-ignore
    data,
    viz,
    currentTimeRange,
    variables: ['job', 'probe', 'instance'],
  });

  return (
    <VizPanel
      //@ts-ignore
      menu={menu}
      title="Reachability"
      viz={viz}
      dataProvider={dataTransformer}
      description={REACHABILITY_DESCRIPTION}
    />
  );
};
