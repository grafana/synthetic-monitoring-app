import React from 'react';
import { VizConfigBuilders } from '@grafana/scenes';
import { useDataTransformer, useQueryRunner, useTimeRange, VizPanel } from '@grafana/scenes-react';
import { BigValueGraphMode, ThresholdsMode } from '@grafana/schema';
import { getUptimeQuery } from 'queries/uptime';

import { Check } from 'types';
import { useMetricsDS } from 'hooks/useMetricsDS';
import { UPTIME_DESCRIPTION } from 'components/constants';
import { useVizPanelMenu } from 'scenes/Common/useVizPanelMenu';

export const UptimeStat = ({ check }: { check: Check }) => {
  const metricsDS = useMetricsDS();

  const uptimeQuery = getUptimeQuery({
    job: `$job`,
    instance: `$instance`,
    probe: `$probe`,
    frequency: check.frequency,
  });

  const queries = [
    {
      expr: uptimeQuery.expr,
      exemplar: true,
      hide: false,
      instant: false,
      range: true,
      interval: uptimeQuery.interval,
      legendFormat: '',
      refId: 'B',
    },
  ];

  const dataProvider = useQueryRunner({
    queries,
    datasource: metricsDS,
    maxDataPoints: uptimeQuery.maxDataPoints,
  });

  const transformation = {
    id: 'reduce',
    options: {
      reducers: ['mean'],
    },
  };

  const dataTransformer = useDataTransformer({
    transformations: [transformation],
    data: dataProvider,
  });

  const viz = VizConfigBuilders.stat()
    .setOption('graphMode', BigValueGraphMode.None)
    .setUnit('percentunit')
    .setOption('reduceOptions', {
      calcs: ['mean'],
      fields: '',
      values: false,
    })
    .setDecimals(2)
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
    .setNoValue('N/A')
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
    <VizPanel menu={menu} title="Uptime" viz={viz} dataProvider={dataTransformer} description={UPTIME_DESCRIPTION} />
  );
};
