import { SceneFlexItem, SceneQueryRunner } from '@grafana/scenes';
import { DataSourceRef } from '@grafana/schema';

import { ExplorablePanel } from 'scenes/ExplorablePanel';

function getQueryRunner(metrics: DataSourceRef) {
  return new SceneQueryRunner({
    datasource: metrics,
    queries: [
      {
        refId: 'A',
        expr: `
          sum by (name) (probe_http_requests_total{job="$job", instance="$instance"})
          /
          count by (name) (probe_http_requests_total{job="$job", instance="$instance"})`,
        range: true,
        instant: false,
        legendFormat: '{{ name }}',
        format: 'time_series',
      },
    ],
  });
}

export function getSuccessRateByUrl(metrics: DataSourceRef) {
  return new SceneFlexItem({
    body: new ExplorablePanel({
      $data: getQueryRunner(metrics),
      pluginId: 'timeseries',
      title: 'Success rate by target',
      fieldConfig: {
        defaults: {
          unit: 'percentunit',
          max: 1,
        },
        overrides: [],
      },
    }),
  });
}
