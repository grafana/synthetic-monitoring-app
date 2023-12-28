import { SceneFlexItem, SceneQueryRunner } from '@grafana/scenes';
import { DataSourceRef } from '@grafana/schema';

import { ExplorablePanel } from 'scenes/ExplorablePanel';

function getQueryRunner(metrics: DataSourceRef, labelName: string, labelValue: string) {
  const queries = [
    {
      exemplar: true,
      expr: `sum by (probe) (
        probe_http_requests_total{instance="$instance", job="$job", probe=~".*", ${labelName}="${labelValue}"}
      )
      /
      sum by (probe) (
        probe_http_requests_total{instance="$instance", job="$job", probe=~".*", ${labelName}="${labelValue}"}
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

export function getSuccessRateByTargetProbe(metrics: DataSourceRef, labelName: string, labelValue: string) {
  return new SceneFlexItem({
    body: new ExplorablePanel({
      pluginId: 'timeseries',
      title: `Success rate by probe for ${name}`,
      $data: getQueryRunner(metrics, labelName, labelValue),
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
