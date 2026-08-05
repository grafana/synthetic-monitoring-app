import React from 'react';
import { VizConfigBuilders } from '@grafana/scenes';
import { useDataTransformer, useQueryRunner, useTimeRange, VizPanel } from '@grafana/scenes-react';
import { BigValueGraphMode, ThresholdsMode } from '@grafana/schema';

import { Check } from 'types';
import { QueryType } from 'datasource/types';
import { useMetricsDS } from 'hooks/useMetricsDS';
import { useSMDS } from 'hooks/useSMDS';
import { REACHABILITY_DESCRIPTION } from 'components/constants';
import { useVizPanelMenu } from 'scenes/Common/useVizPanelMenu';

export const ReachabilityStat = ({ check }: { check: Check }) => {
  const smDS = useSMDS();
  // only so "Explore" opens against the datasource that holds the data
  const metricsDS = useMetricsDS();

  const dataProvider = useQueryRunner({
    queries: [
      {
        refId: 'reachability',
        queryType: QueryType.Reachability,
        job: `$job`,
        instance: `$instance`,
        probe: `$probe`,
        frequency: check.frequency,
        legendFormat: 'reachability',
      },
    ],
    datasource: smDS.instanceSettings,
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
    exploreDatasourceUid: metricsDS?.uid,
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
