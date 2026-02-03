import React from 'react';
import { VizConfigBuilders } from '@grafana/scenes';
import { useQueryRunner, useTimeRange, useVariables, VizPanel } from '@grafana/scenes-react';
import {
  AxisColorMode,
  AxisPlacement,
  GraphDrawStyle,
  GraphGradientMode,
  LegendDisplayMode,
  LineInterpolation,
  ScaleDistribution,
  SortOrder,
  StackingMode,
  TooltipDisplayMode,
  VisibilityMode,
} from '@grafana/schema';

import { useMetricsDS } from 'hooks/useMetricsDS';
import { useVizPanelMenu } from 'scenes/Common/useVizPanelMenu';

import { getCheckTypeTitle } from './SummaryDashboard.utils';

export const SummaryLatencyViz = () => {
  const metricsDS = useMetricsDS();
  const [currentTimeRange] = useTimeRange();
  const variables = useVariables();
  const checkTypeVar = variables.find((v) => v.state.name === 'check_type');

  const query = `
    (
      sum(
        rate(probe_all_duration_seconds_sum{probe=~"$probe"}[$__rate_interval])
        * on (instance, job, probe, config_version) group_left max(sm_check_info{check_name=~"$check_type", region=~"$region", $Filters})
        by (instance, job, probe, config_version)
      )
      by (job, instance)
    )
    /
    (
      sum(
        rate(probe_all_duration_seconds_count{probe=~"$probe"}[$__rate_interval])
        * on (instance, job, probe, config_version) group_left max(sm_check_info{check_name=~"$check_type", region=~"$region", $Filters})
        by (instance, job, probe, config_version)
      )
      by (job, instance)
    )
  `;

  const dataProvider = useQueryRunner({
    queries: [
      {
        expr: query,
        hide: false,
        interval: '1m',
        legendFormat: '{{job}}/{{ instance }}',
        refId: 'A',
      },
    ],
    datasource: metricsDS,
  });

  const viz = VizConfigBuilders.timeseries()
    .setUnit('s')
    .setMin(0)
    .setCustomFieldConfig('drawStyle', GraphDrawStyle.Line)
    .setCustomFieldConfig('lineInterpolation', LineInterpolation.Linear)
    .setCustomFieldConfig('barAlignment', 0)
    .setCustomFieldConfig('lineWidth', 2)
    .setCustomFieldConfig('fillOpacity', 0)
    .setCustomFieldConfig('gradientMode', GraphGradientMode.None)
    .setCustomFieldConfig('spanNulls', true)
    .setCustomFieldConfig('insertNulls', false)
    .setCustomFieldConfig('showPoints', VisibilityMode.Never)
    .setCustomFieldConfig('pointSize', 5)
    .setCustomFieldConfig('stacking', { mode: StackingMode.None, group: 'A' })
    .setCustomFieldConfig('axisPlacement', AxisPlacement.Auto)
    .setCustomFieldConfig('axisLabel', '')
    .setCustomFieldConfig('axisColorMode', AxisColorMode.Text)
    .setCustomFieldConfig('axisBorderShow', false)
    .setCustomFieldConfig('scaleDistribution', { type: ScaleDistribution.Linear })
    .setCustomFieldConfig('axisCenteredZero', false)
    .setCustomFieldConfig('hideFrom', { tooltip: false, viz: false, legend: false })
    .setOption('tooltip', { mode: TooltipDisplayMode.Multi, sort: SortOrder.None })
    .setOption('legend', {
      showLegend: true,
      displayMode: LegendDisplayMode.Table,
      placement: 'bottom',
      calcs: [],
    })
    .setColor({ mode: 'palette-classic' })
    .build();

  const data = dataProvider.useState();

  const menu = useVizPanelMenu({
    data,
    viz,
    currentTimeRange,
    variables: ['probe', 'check_type', 'region', 'Filters'],
  });

  const title = getCheckTypeTitle(checkTypeVar, ' latency');

  return <VizPanel menu={menu} title={title} viz={viz} dataProvider={dataProvider} />;
};

