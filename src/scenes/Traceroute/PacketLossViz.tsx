import React from 'react';
import { VizConfigBuilders } from '@grafana/scenes';
import { useQueryRunner, VizPanel } from '@grafana/scenes-react';

import { useMetricsDS } from 'hooks/useMetricsDS';

export const PacketLoss = () => {
  const metricsDS = useMetricsDS();
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

  return <VizPanel dataProvider={dataProvider} title={`Overall packet loss`} viz={viz} />;
};

const viz = VizConfigBuilders.timeseries().setUnit('percentunit').build();
