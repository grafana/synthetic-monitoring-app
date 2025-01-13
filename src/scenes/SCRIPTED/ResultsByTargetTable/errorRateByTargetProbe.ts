import { SceneFlexItem, SceneQueryRunner } from '@grafana/scenes';
import { DataSourceRef } from '@grafana/schema';

import { ExplorablePanel } from 'scenes/ExplorablePanel';

function getQueryRunner(metrics: DataSourceRef, labelName: string, labelValue: string, method: string) {
  const queries = [
    {
      exemplar: true,
      expr: `sum by (probe, method) (
        probe_http_requests_failed_total{instance="$instance", job="$job", probe=~"$probe", ${labelName}="${labelValue}", method="${method}"}
      )
      /
      sum by (probe, method) (
        probe_http_requests_total{instance="$instance", job="$job", probe=~"$probe", ${labelName}="${labelValue}", method="${method}"}
      )`,
      hide: false,
      range: true,
      interval: '',
      legendFormat: '{{probe}}',
      refId: 'A',
    },
  ];
  return new SceneQueryRunner({
    datasource: metrics,
    queries,
  });
}

export function getErrorRateByTargetProbe(
  metrics: DataSourceRef,
  labelName: string,
  labelValue: string,
  method: string
) {
  return new SceneFlexItem({
    body: new ExplorablePanel({
      pluginId: 'timeseries',
      title: `Error rate by probe for ${labelValue} ${method}`,
      $data: getQueryRunner(metrics, labelName, labelValue, method),
      fieldConfig: {
        overrides: [],
        defaults: {
          unit: 'percentunit',
          max: 1,
        },
      },
    }),
  });
}
