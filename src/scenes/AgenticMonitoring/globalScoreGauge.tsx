import React from 'react';
import { VizConfigBuilders } from '@grafana/scenes';
import { useQueryRunner, VizPanel } from '@grafana/scenes-react';
import { BarGaugeSizing, ThresholdsMode, VizOrientation } from '@grafana/schema';
import { Box } from '@grafana/ui';

import { INFINITY_DS_UID } from './constants';

export const GlobalScoreGaugePanel = () => {
  const dataProvider = useQueryRunner(getQueryRunner());

  return (
    <Box width={`500px`}>
      <VizPanel
        title="Global score"
        description={'Latest aggregated score for the check'}
        viz={viz}
        dataProvider={dataProvider}
      />
    </Box>
  );
};

const viz = VizConfigBuilders.gauge()
  .setMin(0)
  .setMax(100)
  .setUnit('none')
  .setColor({
    mode: 'thresholds',
  })
  .setThresholds({
    mode: ThresholdsMode.Absolute,
    steps: [
      {
        color: 'red',
        value: 0,
      },
      {
        color: 'orange',
        value: 50,
      },
      {
        color: 'green',
        value: 90,
      },
    ],
  })
  .setOption('minVizHeight', 75)
  .setOption('minVizWidth', 75)
  .setOption('orientation', VizOrientation.Auto)
  .setOption('reduceOptions', {
    calcs: ['lastNotNull'],
    fields: '/^score$/',
    values: false,
  })
  .setOption('showThresholdMarkers', true)
  .setOption('sizing', BarGaugeSizing.Auto)
  .setOption('text', {})
  .build();

function getQueryRunner() {
  return {
    datasource: {
      type: 'yesoreyeram-infinity-datasource',
      uid: INFINITY_DS_UID,
    },
    queries: [
      {
        columns: [
          {
            selector: 'score',
            text: '',
            type: 'number',
          },
        ],
        data: 'score,time\n82,1751182089\n80,1751268489\n87,1751362089',
        format: 'table',
        parser: 'backend',
        refId: 'A',
        source: 'inline',
        type: 'csv',
      },
    ],
  };
}
