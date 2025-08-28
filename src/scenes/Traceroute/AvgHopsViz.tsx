import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { VizConfigBuilders } from '@grafana/scenes';
import { useQueryRunner, VizPanel } from '@grafana/scenes-react';
import { BigValueGraphMode } from '@grafana/schema';
import { useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { useMetricsDS } from 'hooks/useMetricsDS';
import { useVizPanelMenu } from 'scenes/Common/useVizPanelMenu';

export const AvgHops = () => {
  const metricsDS = useMetricsDS();
  const styles = useStyles2(getStyles);
  const query = {
    expr: 'avg_over_time(probe_traceroute_total_hops{instance="$instance", job="$job", probe=~"$probe"}[$__rate_interval])',
    refId: 'A',
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
    <div className={styles.avgHops}>
      <VizPanel dataProvider={dataProvider} menu={menu} title={`Average total hops`} viz={viz} />
    </div>
  );
};

const viz = VizConfigBuilders.stat()
  .setOption('graphMode', BigValueGraphMode.None)
  .setOption('reduceOptions', {
    values: false,
    calcs: ['mean'],
    fields: '',
  })
  .build();

const getStyles = (theme: GrafanaTheme2) => ({
  avgHops: css({
    height: '300px',
  }),
});
