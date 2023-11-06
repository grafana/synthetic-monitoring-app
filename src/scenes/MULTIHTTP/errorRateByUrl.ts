import { SceneFlexItem, SceneQueryRunner } from '@grafana/scenes';
import { DataSourceRef } from '@grafana/schema';

import { ExplorablePanel } from 'scenes/ExplorablePanel';

function getQueryRunner(metrics: DataSourceRef) {
  return new SceneQueryRunner({
    datasource: metrics,
    queries: [
      {
        exemplar: true,
        expr: `sum by (probe) (
            probe_http_requests_failed_total{probe=~"$probe", instance="$instance", job="$job", name="$activeStepIndex", method="$stepMethod"}
          )
          /
          sum by (probe) (
            probe_http_requests_total{probe=~"$probe", instance="$instance", job="$job", name="$activeStepIndex", method="$stepMethod"}
          )
        `,
        hide: false,
        interval: '1m',
        intervalFactor: 1,
        legendFormat: '{{probe}}',
        refId: 'A',
      },
    ],
  });
}

export function getErrorRateByUrl(metrics: DataSourceRef) {
  const query = getQueryRunner(metrics);

  return new SceneFlexItem({
    minHeight: 200,
    body: new ExplorablePanel({
      pluginId: 'timeseries',
      title: 'Error Rate for $stepUrl',
      $data: query,
      fieldConfig: {
        defaults: {
          unit: 'percentunit',
          max: 1,
          min: 0,
        },
        overrides: [],
      },
    }),
  });
}
