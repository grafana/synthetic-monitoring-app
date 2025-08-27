import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { VizConfigBuilders } from '@grafana/scenes';
import { useQueryRunner, VizPanel } from '@grafana/scenes-react';
import { AxisPlacement, GraphDrawStyle } from '@grafana/schema';
import { useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { useMetricsDS } from 'hooks/useMetricsDS';
import { useVizPanelMenu } from 'scenes/Common/useVizPanelMenu';

export const RouteHash = () => {
  const styles = useStyles2(getStyles);
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
    <div className={styles.routeHash}>
      <VizPanel
        dataProvider={dataProvider}
        description={`Shows the hashed value of all the hosts traversed in a single traceroute. Can be used to determine the volatility of the routes over time`}
        menu={menu}
        title={`Route hash`}
        viz={viz}
      />
    </div>
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

const getStyles = (theme: GrafanaTheme2) => ({
  routeHash: css({
    height: '300px',
  }),
});
