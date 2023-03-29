import { SceneQueryRunner, SceneVariableSet, VizPanel } from '@grafana/scenes';
import { DataSourceRef } from '@grafana/schema';

function getQueryRunner(variables: SceneVariableSet, metrics: DataSourceRef) {
  return new SceneQueryRunner({
    datasource: metrics,
    $variables: variables,
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

export function getLatencyByPhasePanel(variables: SceneVariableSet, metrics: DataSourceRef) {
  return new VizPanel({
    pluginId: 'barchart',
    title: 'Response latency by phase: $probe ⮕ $job / $instance',
    $data: getQueryRunner(variables, metrics),
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
