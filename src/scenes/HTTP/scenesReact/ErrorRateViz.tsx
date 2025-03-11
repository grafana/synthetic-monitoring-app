import React from 'react';
import { VizConfigBuilders } from '@grafana/scenes';
import { useQueryRunner, VizPanel } from '@grafana/scenes-react';
import {
  AxisColorMode,
  AxisPlacement,
  GraphDrawStyle,
  GraphGradientMode,
  GraphThresholdsStyleMode,
  LineInterpolation,
  ScaleDistribution,
  StackingMode,
  VisibilityMode,
} from '@grafana/schema';

import { useMetricsDS } from 'hooks/useMetricsDS';

export const ErrorRate = ({ minStep }: { minStep: string }) => {
  const metricsDS = useMetricsDS();

  const query = `
  1 - (
    sum by (probe) (
      rate(probe_all_success_sum{probe=~"$probe", instance="$instance", job="$job"}[$__rate_interval])
    )
    /
    sum by (probe) (
      rate(probe_all_success_count{probe=~"$probe", instance="$instance", job="$job"}[$__rate_interval])
    )
  )
`;

  const dataProvider = useQueryRunner({
    queries: [
      {
        exemplar: true,
        expr: query,
        hide: false,
        interval: minStep,
        intervalFactor: 1,
        legendFormat: '{{ probe }}',
        refId: 'errorRate',
      },
    ],
    datasource: metricsDS,
  });

  const viz = VizConfigBuilders.timeseries()
    .setUnit('percentunit')
    .setMax(1)
    .setCustomFieldConfig('drawStyle', GraphDrawStyle.Line)
    .setCustomFieldConfig('lineInterpolation', LineInterpolation.Linear)
    .setCustomFieldConfig('barAlignment', 0)
    .setCustomFieldConfig('lineWidth', 3)
    .setCustomFieldConfig('fillOpacity', 16)
    .setCustomFieldConfig('gradientMode', GraphGradientMode.None)
    .setCustomFieldConfig('spanNulls', true)
    .setCustomFieldConfig('insertNulls', false)
    .setCustomFieldConfig('showPoints', VisibilityMode.Always)
    .setCustomFieldConfig('pointSize', 5)
    .setCustomFieldConfig('stacking', { mode: StackingMode.None, group: 'A' })
    .setCustomFieldConfig('axisPlacement', AxisPlacement.Auto)
    .setCustomFieldConfig('axisLabel', '')
    .setCustomFieldConfig('axisColorMode', AxisColorMode.Text)
    .setCustomFieldConfig('axisBorderShow', false)
    .setCustomFieldConfig('scaleDistribution', { type: ScaleDistribution.Linear })
    .setCustomFieldConfig('axisCenteredZero', false)
    .setCustomFieldConfig('hideFrom', { tooltip: false, viz: false, legend: false })
    .setCustomFieldConfig('thresholdsStyle', { mode: GraphThresholdsStyleMode.Off })

    .build();

  return <VizPanel title="Error Rate : $probe ⮕ $job / $instance" viz={viz} dataProvider={dataProvider} />;
};
