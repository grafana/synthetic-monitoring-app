import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { VizConfigBuilders } from '@grafana/scenes';
import { useQueryRunner, VizPanel } from '@grafana/scenes-react';
import { useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { useMetricsDS } from 'hooks/useMetricsDS';
import { useVizPanelMenu } from 'scenes/Common/useVizPanelMenu';

export const TraceTime = () => {
  const metricsDS = useMetricsDS();
  const styles = useStyles2(getStyles);
  const query = {
    expr: 'sum(rate(probe_all_duration_seconds_sum{probe=~"$probe", instance="$instance", job="$job"}[$__range])) by (probe) / sum(rate(probe_all_duration_seconds_count{probe=~"$probe", instance="$instance", job="$job"}[$__range])) by (probe)',
    format: 'time_series',
    instant: true,
    legendFormat: '{{probe}}',
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
    <div className={styles.traceTime}>
      <VizPanel dataProvider={dataProvider} menu={menu} title={`Average total trace time`} viz={viz} />
    </div>
  );
};

const viz = VizConfigBuilders.stat().setUnit('s').setDecimals(2).build();

const getStyles = (theme: GrafanaTheme2) => ({
  traceTime: css({
    height: '300px',
  }),
});
