import React from 'react';
import { VizConfigBuilders } from '@grafana/scenes';
import { useQueryRunner, VizPanel } from '@grafana/scenes-react';
import { LegendDisplayMode, SortOrder, TooltipDisplayMode } from '@grafana/schema';
import { Box } from '@grafana/ui';

import { INFINITY_DS_UID } from './constants';

export const GlobalScoreTimeseriesPanel = () => {
  const dataProvider = useQueryRunner(getQueryRunner());

  return (
    <Box width={`500px`}>
      <VizPanel
        title="Global score trend"
        description={'Trend of the global score for the last 7 days'}
        viz={viz}
        dataProvider={dataProvider}
      />
    </Box>
  );
};

const viz = VizConfigBuilders.timeseries()
  .setColor({
    mode: 'palette-classic',
  })
  .setOption('legend', {
    calcs: [],
    displayMode: LegendDisplayMode.List,
    placement: 'bottom',
    showLegend: true,
  })
  .setOption('tooltip', {
    hideZeros: false,
    mode: TooltipDisplayMode.Single,
    sort: SortOrder.None,
  })
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
            text: 'Score',
            type: 'number',
          },
          {
            selector: 'time',
            text: 'date',
            type: 'timestamp_epoch_s',
          },
        ],
        data: 'score,time\n82,1751182089\n80,1751268489\n87,1751362089\n84,1751537638\n85,1751534038\n85,1751541238\n86,1751544838\n85,1751548438\n86,1751552038\n87,1751555638\n86,1751559238',
        format: 'table',
        parser: 'backend',
        refId: 'A',
        source: 'inline',
        type: 'csv',
      },
    ],
  };
}
