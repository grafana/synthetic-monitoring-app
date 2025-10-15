import React from 'react';
import { VizConfigBuilders } from '@grafana/scenes';
import { useDataTransformer, useQueryRunner, useTimeRange, VizPanel } from '@grafana/scenes-react';
import { BigValueGraphMode, ThresholdsMode } from '@grafana/schema';
import { getReachabilityQuery } from 'queries/reachability';

import { Check } from 'types';
import { useMetricsDS } from 'hooks/useMetricsDS';
import { REACHABILITY_DESCRIPTION } from 'components/constants';
import { useVizPanelMenu } from 'scenes/Common/useVizPanelMenu';

export const ReachabilityStat = ({ check }: { check: Check }) => {
  const metricsDS = useMetricsDS();

  const query = getReachabilityQuery({
    job: `$job`,
    instance: `$instance`,
    probe: `$probe`,
    frequency: check.frequency,
  });

  const queries = [
    {
      expr: query.expr,
      interval: query.interval,
      range: true,
      refId: 'reachability',
      legendFormat: 'reachability',
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
          reducers: ['mean'],
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
    data,
    viz,
    currentTimeRange,
    variables: ['job', 'probe', 'instance'],
  });

  return (
    <VizPanel
      menu={menu}
      title="Reachability"
      viz={viz}
      dataProvider={dataTransformer}
      description={REACHABILITY_DESCRIPTION}
    />
  );
};
