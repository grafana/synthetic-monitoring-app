import React from 'react';
import { VizConfigBuilders } from '@grafana/scenes';
import { useQueryRunner, VizPanel } from '@grafana/scenes-react';
import {
  GraphDrawStyle,
  GraphGradientMode,
  LegendDisplayMode,
  LineInterpolation,
  TooltipDisplayMode,
  VisibilityMode,
} from '@grafana/schema';
import { Box } from '@grafana/ui';

import { Check } from 'types';
import { useMetricsDS } from 'hooks/useMetricsDS';

interface SyntheticChecksPanelChartProps {
  checks: Check[];
  timeRangeLabel: string;
}

function buildJobInstanceFilter(checks: Check[]): string {
  if (checks.length === 0) {
    return 'job="__none__"';
  }

  if (checks.length === 1) {
    return `job="${checks[0].job}", instance="${checks[0].target}"`;
  }

  const jobs = checks.map((c) => c.job).join('|');
  const instances = checks.map((c) => c.target).join('|');

  return `job=~"${jobs}", instance=~"${instances}"`;
}

export const SyntheticChecksPanelChart = ({ checks, timeRangeLabel }: SyntheticChecksPanelChartProps) => {
  const metricsDS = useMetricsDS();
  const filter = buildJobInstanceFilter(checks);

  const dataProvider = useQueryRunner({
    queries: [
      {
        refId: 'Reachability',
        expr: `sum by (job, instance) (rate(probe_all_success_sum{${filter}}[$__rate_interval])) / sum by (job, instance) (rate(probe_all_success_count{${filter}}[$__rate_interval]))`,
        legendFormat: 'Reachability',
        interval: '1m',
      },
      {
        refId: 'Latency',
        expr: `sum by (job, instance) (rate(probe_all_duration_seconds_sum{${filter}}[$__rate_interval])) / sum by (job, instance) (rate(probe_all_duration_seconds_count{${filter}}[$__rate_interval]))`,
        legendFormat: 'Latency',
        interval: '1m',
      },
      {
        refId: 'Uptime',
        expr: `max by (job, instance) (max_over_time(probe_success{${filter}}[5m]))`,
        legendFormat: 'Uptime',
        interval: '1m',
      },
    ],
    datasource: metricsDS,
  });

  const viz = VizConfigBuilders.timeseries()
    .setCustomFieldConfig('drawStyle', GraphDrawStyle.Line)
    .setCustomFieldConfig('lineInterpolation', LineInterpolation.Smooth)
    .setCustomFieldConfig('lineWidth', 2)
    .setCustomFieldConfig('fillOpacity', 0)
    .setCustomFieldConfig('gradientMode', GraphGradientMode.None)
    .setCustomFieldConfig('spanNulls', true)
    .setCustomFieldConfig('showPoints', VisibilityMode.Never)
    .setOption('tooltip', { mode: TooltipDisplayMode.Multi })
    .setOption('legend', {
      showLegend: true,
      displayMode: LegendDisplayMode.List,
      placement: 'bottom',
    })
    .setColor({ mode: 'palette-classic' })
    .build();

  return (
    <Box height="250px">
      <VizPanel title={`Metrics over time ${timeRangeLabel}`} viz={viz} dataProvider={dataProvider} />
    </Box>
  );
};
