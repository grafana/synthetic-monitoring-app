import { SceneQueryRunner } from '@grafana/scenes';
import { DataSourceRef } from '@grafana/schema';

import { ExplorablePanel } from 'scenes/ExplorablePanel';

function getQueryRunner(metrics: DataSourceRef) {
  return new SceneQueryRunner({
    datasource: metrics,
    queries: [
      {
        expr: 'avg(probe_icmp_duration_seconds{probe=~"$probe", instance="$instance", job="$job"}) by (phase)',
        instant: false,
        interval: '',
        intervalFactor: 1,
        legendFormat: '{{phase}}',
        refId: 'A',
      },
    ],
  });
}

export function getLatencyByPhasePanel(metrics: DataSourceRef) {
  return new ExplorablePanel({
    pluginId: 'barchart',
    title: 'Response latency by phase: $probe ⮕ $job / $instance',
    $data: getQueryRunner(metrics),
    fieldConfig: {
      defaults: {
        unit: 's',
      },
      overrides: [],
    },
    options: {
      xTickLabelSpacing: 100,
      stacking: 'normal',
      legend: {
        showLegend: true,
        displayMode: 'table',
        placement: 'right',
        calcs: [],
      },
    },
  });
}
