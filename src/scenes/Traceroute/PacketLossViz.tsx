import React from 'react';
import { VizConfigBuilders } from '@grafana/scenes';
import { useQueryRunner, VizPanel } from '@grafana/scenes-react';

import { useMetricsDS } from 'hooks/useMetricsDS';
import { useVizPanelMenu } from 'scenes/Common/useVizPanelMenu';

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

  const menu = useVizPanelMenu({
    data: dataProvider.useState(),
    viz,
  });

  return (
    <VizPanel
      dataProvider={dataProvider}
      description={`CAUTION: this averages loss across ALL hops, including intermediate routers that deliberately deprioritize ICMP TTL-exceeded replies. A high value here while the destination still answers every packet (reachability ~100%) is usually NOT a problem. Use the per-hop panels to see whether loss persists to the destination — only that indicates real forwarding loss.`}
      menu={menu}
      title={`Overall packet loss — all hops`}
      viz={viz}
    />
  );
};

const viz = VizConfigBuilders.timeseries().setUnit('percentunit').build();
