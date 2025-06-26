import React from 'react';
import { VizConfigBuilders } from '@grafana/scenes';
import { useQueryRunner, VizPanel } from '@grafana/scenes-react';

import { DSQuery } from 'queries/queries.types';
import { useMetricsDS } from 'hooks/useMetricsDS';
import { useVizPanelMenu } from 'scenes/Common/useVizPanelMenu';

export const DataSent = ({ query }: { query: DSQuery }) => {
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

  const viz = VizConfigBuilders.timeseries().setUnit('decbytes').build();
  const data = dataProvider.useState();
  const menu = useVizPanelMenu({ data, viz });

  return <VizPanel title="Data sent" viz={viz} dataProvider={dataProvider} menu={menu} />;
};
