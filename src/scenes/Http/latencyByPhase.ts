import { SceneQueryRunner, SceneVariableSet, VizPanel } from '@grafana/scenes';
import { DataSourceRef, ThresholdsMode } from '@grafana/schema';

function getQueryRunner(variables: SceneVariableSet, metrics: DataSourceRef) {
  return new SceneQueryRunner({
    datasource: metrics,
    $variables: variables,
    maxDataPoints: 100,
    queries: [
      {
        expr: 'avg(probe_http_duration_seconds{probe=~"$probe", instance="$instance", job="$job"}) by (phase)',
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
    $variables: variables,
    $data: getQueryRunner(variables, metrics),
    title: 'Response latency by phase: $probe ⮕ $job / $instance',
    placement: {
      height: 300,
    },
    fieldConfig: {
      defaults: {
        custom: {},
        color: {
          mode: 'palette-classic',
        },
        mappings: [],
        thresholds: {
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
        },
        links: [],
      },
      overrides: [],
    },
    options: {
      xTickLabelRotation: 0,
      xTickLabelSpacing: 100,

      showValue: 'auto',
      stacking: 'normal',
      barWidth: 0.97,
      fullHighlight: false,
      tooltip: {
        mode: 'single',
        sort: 'none',
      },
      legend: {
        showLegend: true,
        displayMode: 'list',
        placement: 'bottom',
        calcs: [],
      },
    },
  });
}
