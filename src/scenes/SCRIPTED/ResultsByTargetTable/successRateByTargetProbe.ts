import { SceneFlexItem, SceneQueryRunner } from '@grafana/scenes';
import { DataSourceRef } from '@grafana/schema';

import { ExplorablePanel } from 'scenes/ExplorablePanel';

function getQueryRunner(metrics: DataSourceRef, labelName: string, labelValue: string, method: string) {
  const queries = [
    {
      exemplar: true,
      expr: `sum by (probe) (
        probe_http_requests_total{instance="$instance", job="$job", probe=~".*", ${labelName}="${labelValue}", method="${method}"}
      )
      /
      sum by (probe) (
        probe_http_requests_total{instance="$instance", job="$job", probe=~".*", ${labelName}="${labelValue}", method="${method}"}
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

export function getSuccessRateByTargetProbe(
  metrics: DataSourceRef,
  labelName: string,
  labelValue: string,
  method: string
) {
  return new SceneFlexItem({
    body: new ExplorablePanel({
      pluginId: 'timeseries',
      title: `Success rate by probe for ${labelValue} ${method}`,
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
