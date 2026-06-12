import React from 'react';
import { VizConfigBuilders } from '@grafana/scenes';
import { useQueryRunner, VizPanel } from '@grafana/scenes-react';
import { BigValueGraphMode, ThresholdsMode } from '@grafana/schema';

import { useMetricsDS } from 'hooks/useMetricsDS';
import { useVizPanelMenu } from 'scenes/Common/useVizPanelMenu';

export const TraceCompletionTime = () => {
  const metricsDS = useMetricsDS();

  const query = {
    expr: 'avg(avg_over_time(probe_duration_seconds{job="$job", instance="$instance", probe=~"$probe"}[$__range]))',
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
      description={`Total time to run all traceroute cycles. This is execution walltime, NOT network latency — a multi-second value here is normal. For latency, read the per-hop RTT in the table below.`}
      menu={menu}
      title={`Trace completion time`}
      viz={viz}
    />
  );
};

const viz = VizConfigBuilders.stat()
  .setOption('graphMode', BigValueGraphMode.None)
  .setUnit('s')
  .setDecimals(2)
  .setNoValue('N/A')
  .setThresholds({
    mode: ThresholdsMode.Absolute,
    steps: [
      {
        color: 'text',
        value: 0,
      },
    ],
  })
  .build();
