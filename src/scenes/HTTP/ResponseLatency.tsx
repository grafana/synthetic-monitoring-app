import React from 'react';
import { VizConfigBuilders } from '@grafana/scenes';
import { useQueryRunner, useTimeRange, VizPanel } from '@grafana/scenes-react';
import { GraphDrawStyle, StackingMode, ThresholdsMode } from '@grafana/schema';

import { useMetricsDS } from 'hooks/useMetricsDS';
import { useVizPanelMenu } from 'scenes/Common/useVizPanelMenu';

export const ResponseLatency = () => {
  const metricsDS = useMetricsDS();

  const dataProvider = useQueryRunner({
    maxDataPoints: 100,
    queries: [
      {
        expr: 'avg(probe_http_duration_seconds{probe=~"$probe", instance="$instance", job="$job"}) by (phase)',
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
