import React from 'react';
import { VizConfigBuilders } from '@grafana/scenes';
import { useQueryRunner, VizPanel } from '@grafana/scenes-react';

import { useMetricsDS } from 'hooks/useMetricsDS';
import { useVizPanelMenu } from 'scenes/Common/useVizPanelMenu';

export const DistinctTargets = ({ metric = 'probe_http_info' }: { metric?: string }) => {
  const metricsDS = useMetricsDS();

  const dataProvider = useQueryRunner({
    queries: [
      {
        expr: `count by (job, target) (
          count by (url) (
            ${metric}{probe=~"\${probe}", job="\${job}", instance="\${instance}"}
          )
        )`,
        refId: 'A',
        queryType: 'instant',
      },
    ],
    datasource: metricsDS,
  });

  const viz = VizConfigBuilders.stat().build();
  const data = dataProvider.useState();
  const menu = useVizPanelMenu({ data, viz });

  return <VizPanel title="Distinct targets" viz={viz} dataProvider={dataProvider} menu={menu} />;
};
