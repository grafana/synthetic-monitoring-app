import React from 'react';
import { VizConfigBuilders } from '@grafana/scenes';
import { useQueryRunner, VizPanel } from '@grafana/scenes-react';
import { LegendDisplayMode } from '@grafana/schema';

import { useLogsDS } from 'hooks/useLogsDS';
import { useVizPanelMenu } from 'scenes/Common/useVizPanelMenu';

export const HopLossOverTime = () => {
  const logsDS = useLogsDS();

  // Fixed 15m window instead of $__auto: each execution can land on a different
  // ECMP path, so per-execution loss whipsaws 0-100% per hop. Averaging across
  // executions turns that into readable per-hop bands.
  const query = {
    expr: 'avg by (TTL) (avg_over_time({check_name="traceroute", job="$job", instance="$instance", probe=~"$probe"} | logfmt | TTL != `` | unwrap LossPercent [15m]))',
    legendFormat: 'hop {{TTL}}',
    refId: 'A',
  };

  const dataProvider = useQueryRunner({
    queries: [query],
    datasource: logsDS,
  });

  const menu = useVizPanelMenu({
    data: dataProvider.useState(),
    viz,
  });

  return (
    <VizPanel
      dataProvider={dataProvider}
      description={`Average loss per hop position, smoothed over 15 minute windows. Loss that starts at one hop and persists through every later hop INCLUDING the destination is real forwarding loss starting at that hop. Loss isolated to a single middle hop is ICMP deprioritization — informational only.`}
      menu={menu}
      title={`Packet loss by hop (TTL) over time`}
      viz={viz}
    />
  );
};

const viz = VizConfigBuilders.timeseries()
  .setUnit('percent')
  .setMin(0)
  .setMax(100)
  .setCustomFieldConfig(`spanNulls`, true)
  .setOption(`legend`, {
    calcs: ['mean'],
    displayMode: LegendDisplayMode.Table,
    placement: 'right',
  })
  .build();
