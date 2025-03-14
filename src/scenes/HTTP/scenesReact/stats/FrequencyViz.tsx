import React from 'react';
import { VizConfigBuilders } from '@grafana/scenes';
import { useDataTransformer, useQueryRunner, useTimeRange, VizPanel } from '@grafana/scenes-react';
import { BigValueGraphMode, ThresholdsMode } from '@grafana/schema';

import { useMetricsDS } from 'hooks/useMetricsDS';

import { useVizPanelMenu } from '../useVizPanelMenu';

export const Frequency = () => {
  const metricsDS = useMetricsDS();

  const queries = [
    {
      expr: `sum by (frequency) (
          topk(
              1,
              sm_check_info{instance="$instance", job="$job", probe=~"$probe"}
          )
        )`,

      instant: false,
      refId: 'D',
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
        id: 'labelsToFields',
        options: {},
      },
      {
        id: 'merge',
        options: {},
      },
    ],
    data: dataProvider,
  });

  const viz = VizConfigBuilders.stat()
    .setOption('graphMode', BigValueGraphMode.None)
    .setUnit('ms')
    .setNoValue('N/A')
    .setColor({ mode: 'fixed', fixedColor: 'green' })
    .setOption('reduceOptions', { values: false, calcs: ['lastNotNull'], fields: '/^frequency$/' })
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
      //@ts-ignore
      menu={menu}
      title="Frequency"
      viz={viz}
      dataProvider={dataTransformer}
      description={'How often is the target checked?'}
    />
  );
};
