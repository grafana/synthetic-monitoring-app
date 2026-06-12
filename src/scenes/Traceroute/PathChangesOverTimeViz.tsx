import React from 'react';
import { VizConfigBuilders } from '@grafana/scenes';
import { useQueryRunner, VizPanel } from '@grafana/scenes-react';
import { GraphDrawStyle } from '@grafana/schema';

import { useMetricsDS } from 'hooks/useMetricsDS';
import { useVizPanelMenu } from 'scenes/Common/useVizPanelMenu';

export const PathChangesOverTime = () => {
  const metricsDS = useMetricsDS();

  // The changes() window is a fixed 15m rather than $__interval: the interval can be
  // narrower than the check frequency, in which case the panel renders empty.
  const query = {
    expr: 'sum by (probe) (changes(probe_traceroute_route_hash{job="$job", instance="$instance", probe=~"$probe"}[15m]))',
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
    <VizPanel
      dataProvider={dataProvider}
      description={`Route fingerprint changes per 15 minute window. Stable networks show a flat zero line; ECMP/load-balanced networks show constant low-level flapping. Correlate bursts here with the packet loss and hops panels.`}
      menu={menu}
      title={`Path changes over time`}
      viz={viz}
    />
  );
};

const viz = VizConfigBuilders.timeseries()
  .setCustomFieldConfig(`drawStyle`, GraphDrawStyle.Bars)
  .setCustomFieldConfig(`fillOpacity`, 80)
  .setCustomFieldConfig(`lineWidth`, 0)
  .setUnit('short')
  .setDecimals(0)
  .build();
