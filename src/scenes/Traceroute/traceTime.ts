import { SceneQueryRunner, VizPanel } from '@grafana/scenes';
import { DataSourceRef } from '@grafana/schema';

function getQueryRunner(metrics: DataSourceRef) {
  return new SceneQueryRunner({
    datasource: metrics,
    queries: [
      {
        exemplar: false,
        expr: 'sum(rate(probe_all_duration_seconds_sum{probe=~"$probe", instance="$instance", job="$job"}[$__range])) by (probe) / sum(rate(probe_all_duration_seconds_count{probe=~"$probe", instance="$instance", job="$job"}[$__range])) by (probe)',
        format: 'time_series',
        instant: true,
        interval: '',
        legendFormat: '{{probe}}',
        refId: 'A',
      },
    ],
  });
}

export function getTraceTimePanel(metrics: DataSourceRef) {
  return new VizPanel({
    $data: getQueryRunner(metrics),
    title: 'Average total trace time',
    pluginId: 'stat',
    fieldConfig: {
      defaults: {
        decimals: 2,
        unit: 's',
      },
      overrides: [],
    },
  });
}
