import React from 'react';
import { VizConfigBuilders } from '@grafana/scenes';
import { useQueryRunner, VizPanel } from '@grafana/scenes-react';
import {
  AxisColorMode,
  AxisPlacement,
  GraphDrawStyle,
  GraphGradientMode,
  GraphThresholdsStyleMode,
  LegendDisplayMode,
  LineInterpolation,
  ScaleDistribution,
  SortOrder,
  StackingMode,
  ThresholdsMode,
  TooltipDisplayMode,
  VisibilityMode,
} from '@grafana/schema';

import { useMetricsDS } from 'hooks/useMetricsDS';

export const ResponseLatencyByProbe = () => {
  const metricsDS = useMetricsDS();

  const dataProvider = useQueryRunner({
    maxDataPoints: 100,
    queries: [
      {
        expr: 'avg(probe_duration_seconds{probe=~"$probe", instance="$instance", job="$job"} * on (instance, job,probe,config_version) group_left probe_success{probe=~"$probe",instance="$instance", job="$job"} > 0) by (probe)',
        instant: false,
        interval: '',
        intervalFactor: 1,
        legendFormat: '{{probe}}',
        refId: 'A',
      },
    ],
    datasource: metricsDS,
  });

  const viz = VizConfigBuilders.timeseries()
    .setUnit('s')

    .setCustomFieldConfig('drawStyle', GraphDrawStyle.Points)
    .setCustomFieldConfig('lineInterpolation', LineInterpolation.Linear)
    .setCustomFieldConfig('barAlignment', 0)
    .setCustomFieldConfig('lineWidth', 0)
    .setCustomFieldConfig('fillOpacity', 100)
    .setCustomFieldConfig('gradientMode', GraphGradientMode.None)
    .setCustomFieldConfig('spanNulls', false)
    .setCustomFieldConfig('showPoints', VisibilityMode.Always)
    .setCustomFieldConfig('pointSize', 4)
    .setCustomFieldConfig('stacking', {
      mode: StackingMode.None,
      group: 'A',
    })
    .setCustomFieldConfig('axisPlacement', AxisPlacement.Auto)
    .setCustomFieldConfig('axisLabel', '')
    .setCustomFieldConfig('axisColorMode', AxisColorMode.Text)
    .setCustomFieldConfig('scaleDistribution', {
      type: ScaleDistribution.Linear,
    })
    .setCustomFieldConfig('axisCenteredZero', false)
    .setCustomFieldConfig('hideFrom', {
      tooltip: false,
      viz: false,
      legend: false,
    })
    .setCustomFieldConfig('thresholdsStyle', {
      mode: GraphThresholdsStyleMode.Off,
    })
    .setColor({
      mode: 'palette-classic',
    })
    .setOption('tooltip', {
      mode: TooltipDisplayMode.Multi,
      sort: SortOrder.None,
    })
    .setOption('legend', {
      showLegend: true,
      displayMode: LegendDisplayMode.Table,
      placement: 'right',
      calcs: ['mean', 'lastNotNull'],
    })
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

  return <VizPanel title="Response latency by probe" viz={viz} dataProvider={dataProvider} />;
};
