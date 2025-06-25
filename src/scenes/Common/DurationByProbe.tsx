import React from 'react';
import { VizConfigBuilders } from '@grafana/scenes';
import { useQueryRunner, VizPanel } from '@grafana/scenes-react';

import { useMetricsDS } from 'hooks/useMetricsDS';
import { useVizPanelMenu } from 'scenes/Common/useVizPanelMenu';

export const DurationByProbe = () => {
  const metricsDS = useMetricsDS();

  const dataProvider = useQueryRunner({
    queries: [
      {
        expr: 'sum by (probe) (probe_http_total_duration_seconds{probe=~"${probe}", job="${job}", instance="${instance}"})',
        refId: 'A',
        queryType: 'range',
        legendFormat: '__auto',
      },
    ],
    datasource: metricsDS,
  });

  const viz = VizConfigBuilders.timeseries().setUnit('s').build();
  const data = dataProvider.useState();
  const menu = useVizPanelMenu({ data, viz });

  return <VizPanel title="Duration by probe" viz={viz} dataProvider={dataProvider} menu={menu} />;
};
