import React from 'react';
import { VizConfigBuilders } from '@grafana/scenes';
import { useQueryRunner, useTimeRange, VizPanel } from '@grafana/scenes-react';
import { GraphDrawStyle, LegendDisplayMode, StackingMode, ThresholdsMode } from '@grafana/schema';

import { useMetricsDS } from 'hooks/useMetricsDS';
import { useVizPanelMenu } from 'scenes/Common/useVizPanelMenu';

interface ResponseLatencyProps {
  metric: `probe_http_duration_seconds` | `probe_icmp_duration_seconds`;
}

export const ResponseLatency = ({ metric }: ResponseLatencyProps) => {
  const metricsDS = useMetricsDS();

  const dataProvider = useQueryRunner({
    maxDataPoints: 100,
    queries: [
      {
        expr: `avg(${metric}{probe=~"$probe", instance="$instance", job="$job"}) by (phase)`,
        instant: false,
        interval: '',
        intervalFactor: 1,
        legendFormat: '{{phase}}',
        refId: 'F',
      },
    ],
    datasource: metricsDS,
  });

  const viz = VizConfigBuilders.timeseries()
    .setUnit(`s`)
    .setOption('legend', {
      showLegend: true,
      displayMode: LegendDisplayMode.Table,
      placement: 'right',
      calcs: ['mean', 'lastNotNull'],
    })
    .setCustomFieldConfig('drawStyle', GraphDrawStyle.Bars)
    .setCustomFieldConfig('fillOpacity', 100)
    .setCustomFieldConfig('stacking', { mode: StackingMode.Normal, group: 'A' })
    .setColor({ mode: 'palette-classic' })
    .setThresholds({
      mode: ThresholdsMode.Absolute,
      steps: [
        {
          value: 0,
          color: 'green',
        },
        {
          value: 80,
          color: 'red',
        },
      ],
    })

    .build();

  const data = dataProvider.useState();
  const [currentTimeRange] = useTimeRange();

  const menu = useVizPanelMenu({
    data,
    viz,
    currentTimeRange,
    variables: ['job', 'probe', 'instance'],
  });

  return (
    <VizPanel
      menu={menu}
      title="Response latency by phase: $probe ⮕ $job / $instance"
      viz={viz}
      dataProvider={dataProvider}
    />
  );
};
