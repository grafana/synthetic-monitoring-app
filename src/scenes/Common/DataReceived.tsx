import React from 'react';
import { VizConfigBuilders } from '@grafana/scenes';
import { useQueryRunner, VizPanel } from '@grafana/scenes-react';

import { useMetricsDS } from 'hooks/useMetricsDS';
import { useVizPanelMenu } from 'scenes/Common/useVizPanelMenu';

export const DataReceived = () => {
  const metricsDS = useMetricsDS();

  const dataProvider = useQueryRunner({
    queries: [
      {
        expr: `probe_data_received_bytes{probe=~"$probe", job="$job", instance="$instance"}`,
        refId: 'A',
        queryType: 'range',
        legendFormat: '{{ probe }}',
      },
    ],
    datasource: metricsDS,
  });

  const viz = VizConfigBuilders.timeseries().setUnit('decbytes').build();
  const data = dataProvider.useState();
  const menu = useVizPanelMenu({ data, viz });

  return <VizPanel title="Data received" viz={viz} dataProvider={dataProvider} menu={menu} />;
};
