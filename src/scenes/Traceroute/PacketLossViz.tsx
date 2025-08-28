import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { VizConfigBuilders } from '@grafana/scenes';
import { useQueryRunner, VizPanel } from '@grafana/scenes-react';
import { useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { useMetricsDS } from 'hooks/useMetricsDS';

export const PacketLoss = () => {
  const metricsDS = useMetricsDS();
  const styles = useStyles2(getStyles);
  const query = {
    expr: 'probe_traceroute_packet_loss_percent{instance="$instance", job="$job", probe=~"$probe"}',
    legendFormat: '{{probe}}',
    refId: 'A',
    stepMode: 'min',
  };

  const dataProvider = useQueryRunner({
    queries: [query],
    datasource: metricsDS,
  });

  return (
    <div className={styles.packetLoss}>
      <VizPanel dataProvider={dataProvider} title={`Overall packet loss`} viz={viz} />
    </div>
  );
};

const viz = VizConfigBuilders.timeseries().setUnit('percentunit').build();

const getStyles = (theme: GrafanaTheme2) => ({
  packetLoss: css({
    height: '300px',
  }),
});
