import React from 'react';
import { VizConfigBuilders } from '@grafana/scenes';
import { useQueryRunner, VizPanel } from '@grafana/scenes-react';

import { useMetricsDS } from 'hooks/useMetricsDS';
import { useVizPanelMenu } from 'scenes/Common/useVizPanelMenu';

export const TraceTime = () => {
  const metricsDS = useMetricsDS();
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

  return <VizPanel dataProvider={dataProvider} menu={menu} title={`Average total trace time`} viz={viz} />;
};

const viz = VizConfigBuilders.stat().setUnit('s').setDecimals(2).build();
