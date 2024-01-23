import { SceneFlexItem, SceneQueryRunner } from '@grafana/scenes';
import { DataSourceRef } from '@grafana/schema';

import { ExplorablePanel } from 'scenes/ExplorablePanel';

function getQueryRunner(metrics: DataSourceRef, labelName: string, labelValue: string, method: string) {
  return new SceneQueryRunner({
    datasource: metrics,
    queries: [
      {
        expr: `sum by (probe) (probe_http_total_duration_seconds{probe=~".*", job="$job", instance="$instance", ${labelName}="${labelValue}", method="${method}"})`,
        refId: 'A',
        legendFormat: '{{probe}}',
      },
    ],
  });
}

export function getDurationByTargetProbe(
  metrics: DataSourceRef,
  labelName: string,
  labelValue: string,
  method: string
) {
  return new SceneFlexItem({
    body: new ExplorablePanel({
      $data: getQueryRunner(metrics, labelName, labelValue, method),
      options: {
        instant: false,
      },
      fieldConfig: {
        defaults: {
          unit: 's',
        },
        overrides: [],
      },
      title: 'Duration by probe for ' + labelValue + ' ' + method,
      pluginId: 'timeseries',
    }),
  });
}
