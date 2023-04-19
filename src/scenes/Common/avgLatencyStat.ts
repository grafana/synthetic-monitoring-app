import { SceneQueryRunner, VizPanel } from '@grafana/scenes';
import { DataSourceRef, ThresholdsMode } from '@grafana/schema';

function getQueryRunner(metrics: DataSourceRef) {
  return new SceneQueryRunner({
    datasource: metrics,
    queries: [
      {
        expr: 'sum(rate(probe_all_duration_seconds_sum{probe=~"$probe", instance="$instance", job="$job"}[$__range])) / sum(rate(probe_all_duration_seconds_count{probe=~"$probe", instance="$instance", job="$job"}[$__range]))',
        hide: false,
        instant: true,
        interval: '',
        legendFormat: '',
        refId: 'B',
      },
    ],
  });
}

export function getAvgLatencyStat(metrics: DataSourceRef) {
  const queryRunner = getQueryRunner(metrics);
  return new VizPanel({
    pluginId: 'stat',
    title: 'Average latency',
    description: 'The average time to receive an answer across all the checks during the whole time period.',
    $data: queryRunner,
    fieldConfig: {
      defaults: {
        decimals: 2,
        mappings: [],
        thresholds: {
          mode: ThresholdsMode.Absolute,
          steps: [
            {
              color: 'green',
              value: 0,
            },
            {
              color: 'yellow',
              value: 1,
            },
            {
              color: 'red',
              value: 2,
            },
          ],
        },
        unit: 's',
      },
      overrides: [],
    },
  });
}
