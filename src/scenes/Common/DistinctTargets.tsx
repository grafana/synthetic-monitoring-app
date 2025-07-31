import React from 'react';
import { VizConfigBuilders } from '@grafana/scenes';
import { useQueryRunner, VizPanel } from '@grafana/scenes-react';

import { DSQuery } from 'queries/queries.types';
import { useMetricsDS } from 'hooks/useMetricsDS';
import { useVizPanelMenu } from 'scenes/Common/useVizPanelMenu';

export const DistinctTargets = ({ query }: { query: DSQuery }) => {
  const metricsDS = useMetricsDS();

  const dataProvider = useQueryRunner({
    queries: [
      {
        expr: query.expr,
        refId: 'A',
        instant: query.queryType === 'instant',
        legendFormat: query.legendFormat,
      },
    ],
    datasource: metricsDS,
  });

  const viz = VizConfigBuilders.stat().build();
  const data = dataProvider.useState();
  const menu = useVizPanelMenu({ data, viz });

  return <VizPanel title="Distinct targets" viz={viz} dataProvider={dataProvider} menu={menu} />;
};
