import React from 'react';
import { VizConfigBuilders } from '@grafana/scenes';
import { useQueryRunner, VizPanel } from '@grafana/scenes-react';
import { AxisPlacement, GraphDrawStyle } from '@grafana/schema';

import { useMetricsDS } from 'hooks/useMetricsDS';
import { useVizPanelMenu } from 'scenes/Common/useVizPanelMenu';

export const RouteHash = () => {
  const metricsDS = useMetricsDS();

  const query = {
    expr: 'probe_traceroute_route_hash{probe=~"$probe", job="$job", instance="$instance"}',
    legendFormat: '{{probe}}',
    refId: 'routeHash',
    stepMode: 'min',
  };

  const dataProvider = useQueryRunner({
    queries: [query],
    datasource: metricsDS,
  });

  const menu = useVizPanelMenu({
    data: dataProvider.useState(),
    viz,
  });

  return (
    <VizPanel
      dataProvider={dataProvider}
      description={`Shows the hashed value of all the hosts traversed in a single traceroute. Can be used to determine the volatility of the routes over time`}
      menu={menu}
      title={`Route hash`}
      viz={viz}
    />
  );
};

const viz = VizConfigBuilders.timeseries()
  .setCustomFieldConfig(`drawStyle`, GraphDrawStyle.Line)
  .setCustomFieldConfig(`fillOpacity`, 18)
  .setCustomFieldConfig(`spanNulls`, true)
  .setCustomFieldConfig(`pointSize`, 5)
  .setOverrides((builder) => {
    builder
      .matchFieldsWithName(`probe_traceroute_route_hash`)
      .overrideCustomFieldConfig(`axisPlacement`, AxisPlacement.Hidden);
  })
  .build();
