import { SceneFlexItem, SceneQueryRunner, VizPanel } from '@grafana/scenes';
import { DataSourceRef } from '@grafana/schema';

function getQueryRunner(metrics: DataSourceRef) {
  return new SceneQueryRunner({
    datasource: metrics,
    queries: [
      {
        exemplar: true,
        expr: `sum by (probe) (
            probe_http_requests_failed_total{probe=~"$probe", instance="$instance", job="$job", url="$stepUrl"}
          )
          /
          sum by (probe) (
            probe_http_requests_total{probe=~"$probe", instance="$instance", job="$job", url="$stepUrl"}
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
    body: new VizPanel({
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
