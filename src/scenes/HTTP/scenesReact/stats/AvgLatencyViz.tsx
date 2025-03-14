import React from 'react';
import { VizConfigBuilders } from '@grafana/scenes';
import { useDataTransformer, useQueryRunner, useTimeRange, VizPanel } from '@grafana/scenes-react';
import { BigValueGraphMode, ThresholdsMode } from '@grafana/schema';

import { useMetricsDS } from 'hooks/useMetricsDS';

import { useVizPanelMenu } from '../useVizPanelMenu';

export const AvgLatency = () => {
  const metricsDS = useMetricsDS();

  const queries = [
    {
      expr: `sum(rate(probe_all_duration_seconds_sum{probe=~"$probe", instance="$instance", job="$job"}[$__rate_interval]))`,
      hide: false,
      instant: false,
      legendFormat: 'sum',
      range: true,
      refId: 'A',
    },
    {
      exemplar: true,
      expr: `sum(rate(probe_all_duration_seconds_count{probe=~"$probe", instance="$instance", job="$job"}[$__rate_interval]))`,
      hide: false,
      instant: false,
      legendFormat: 'count',
      range: true,
      refId: 'B',
    },
  ];

  const dataProvider = useQueryRunner({
    queries,
    maxDataPoints: 10,
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
    .setUnit('s')
    .setDecimals(2)
    .setMin(0)
    .setMax(1)
    .setNoValue('N/A')
    .setThresholds({
      mode: ThresholdsMode.Absolute,
      steps: [
        {
          color: 'green',
          value: 0,
        },
        {
          color: 'yellow',
          value: 1,
        },
        {
          color: 'red',
          value: 2,
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
      title="Average latency"
      viz={viz}
      dataProvider={dataTransformer}
      description={'The average time to receive an answer across all the checks during the whole time period.'}
      //@ts-ignore
      menu={menu}
    />
  );
};
