import React from 'react';
import { VizConfigBuilders } from '@grafana/scenes';
import { useQueryRunner, VizPanel } from '@grafana/scenes-react';
import { BigValueGraphMode, ThresholdsMode } from '@grafana/schema';

import { useMetricsDS } from 'hooks/useMetricsDS';
import { useVizPanelMenu } from 'scenes/Common/useVizPanelMenu';

export const PathChangesStat = () => {
  const metricsDS = useMetricsDS();

  const query = {
    expr: 'sum(changes(probe_traceroute_route_hash{job="$job", instance="$instance", probe=~"$probe"}[$__range]))',
    instant: true,
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
    <VizPanel
      dataProvider={dataProvider}
      description={`Number of route fingerprint changes across all selected probes in the time range. 0 = stable path. ECMP/load-balanced networks flap between equally-valid paths constantly, so a high number on a healthy target is common — what matters is a burst of changes correlated with loss or slower traces.`}
      menu={menu}
      title={`Path changes`}
      viz={viz}
    />
  );
};

const viz = VizConfigBuilders.stat()
  .setOption('graphMode', BigValueGraphMode.None)
  .setUnit('short')
  .setDecimals(0)
  .setNoValue('N/A')
  .setThresholds({
    mode: ThresholdsMode.Absolute,
    steps: [
      {
        color: 'green',
        value: 0,
      },
      {
        color: 'yellow',
        value: 1,
      },
      {
        color: 'orange',
        value: 5,
      },
    ],
  })
  .build();
