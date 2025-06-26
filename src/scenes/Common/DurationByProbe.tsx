import React from 'react';
import { VizConfigBuilders } from '@grafana/scenes';
import { useQueryRunner, VizPanel } from '@grafana/scenes-react';

import { DSQuery } from 'queries/queries.types';
import { useMetricsDS } from 'hooks/useMetricsDS';
import { useVizPanelMenu } from 'scenes/Common/useVizPanelMenu';

export const DurationByProbe = ({ query, unit }: { query: DSQuery; unit: string }) => {
  const metricsDS = useMetricsDS();

  const dataProvider = useQueryRunner({
    queries: [
      {
        expr: query.expr,
        refId: 'A',
        range: query.queryType === 'range',
        legendFormat: query.legendFormat,
      },
    ],
    datasource: metricsDS,
  });

  const viz = VizConfigBuilders.timeseries().setUnit(unit).build();
  const data = dataProvider.useState();
  const menu = useVizPanelMenu({ data, viz });

  return <VizPanel title="Duration by probe" viz={viz} dataProvider={dataProvider} menu={menu} />;
};
