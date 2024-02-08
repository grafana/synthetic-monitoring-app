import { SceneFlexItem, SceneQueryRunner } from '@grafana/scenes';
import { DataSourceRef } from '@grafana/schema';

import { ExplorablePanel } from 'scenes/ExplorablePanel';

function getQueryRunner(metrics: DataSourceRef) {
  return new SceneQueryRunner({
    datasource: metrics,
    queries: [
      {
        refId: 'A',
        expr: 'sum by(name)(rate(probe_http_duration_seconds{job="$job", instance="$instance"}[5m]))',
        range: true,
        legendFormat: '{{ name }}',
        format: 'time_series',
      },
    ],
  });
}
export function getTimingByTarget(metrics: DataSourceRef) {
  return new SceneFlexItem({
    body: new ExplorablePanel({
      $data: getQueryRunner(metrics),
      pluginId: 'timeseries',
      title: 'Timing by target',
      fieldConfig: {
        defaults: {
          unit: 's',
        },
        overrides: [],
      },
    }),
  });
}
