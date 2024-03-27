import { SceneQueryRunner } from '@grafana/scenes';
import { DataSourceRef, ThresholdsMode } from '@grafana/schema';

import { ExplorablePanel } from 'scenes/ExplorablePanel';

import { divideSumByCountTransformation } from './divideSumByCountTransformation';

function getQueryRunner(metrics: DataSourceRef, minStep: string) {
  const runner = new SceneQueryRunner({
    datasource: metrics,
    minInterval: minStep,
    maxDataPoints: 10,
    queries: [
      {
        expr: 'sum(rate(probe_all_duration_seconds_sum{probe=~"$probe", instance="$instance", job="$job"}[$__rate_interval]))',
        hide: false,
        instant: false,
        range: true,
        legendFormat: 'sum',
        refId: 'A',
      },
      {
        expr: 'sum(rate(probe_all_duration_seconds_count{probe=~"$probe", instance="$instance", job="$job"}[$__rate_interval]))',
        hide: false,
        instant: false,
        range: true,
        legendFormat: 'count',
        refId: 'B',
      },
    ],
  });

  return divideSumByCountTransformation(runner);
}

export function getAvgLatencyStat(metrics: DataSourceRef, minStep: string) {
  const queryRunner = getQueryRunner(metrics, minStep);
  return new ExplorablePanel({
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
