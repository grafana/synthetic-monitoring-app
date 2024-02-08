import { SceneQueryRunner } from '@grafana/scenes';
import { DataSourceRef } from '@grafana/schema';

import { ExplorablePanel } from 'scenes/ExplorablePanel';

const query = `
  100 * (
    1 - (
      sum(
        rate(probe_all_success_sum{probe=~"$probe", instance="$instance", job="$job"}[$__rate_interval])
      )
      /
      sum(
        rate(probe_all_success_count{probe=~"$probe", instance="$instance", job="$job"}[$__rate_interval])
      )
    )
  )
`;

function getQueryRunner(metrics: DataSourceRef) {
  return new SceneQueryRunner({
    datasource: metrics,
    queries: [
      {
        exemplar: true,
        expr: query,
        hide: false,
        interval: '1m',
        intervalFactor: 1,
        legendFormat: 'errors',
        refId: 'A',
      },
    ],
  });
}

export function getErrorRateTimeseries(metrics: DataSourceRef) {
  return new ExplorablePanel({
    pluginId: 'timeseries',
    title: 'Error Rate : $probe ⮕ $job / $instance',
    $data: getQueryRunner(metrics),
    options: {
      yaxes: [
        {
          format: 'percent',
        },
      ],
    },
  });
}
