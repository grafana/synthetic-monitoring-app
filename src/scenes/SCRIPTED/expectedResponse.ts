import { SceneFlexItem, SceneQueryRunner } from '@grafana/scenes';
import { DataSourceRef } from '@grafana/schema';

import { ExplorablePanel } from 'scenes/ExplorablePanel';

function getQueryRunner(metrics: DataSourceRef, labelName: string, labelValue: string, method: string) {
  return new SceneQueryRunner({
    datasource: metrics,
    queries: [
      {
        expr: `
          sum by (probe) (probe_http_got_expected_response{job="$job", instance="$instance", ${labelName}="${labelValue}", probe=~"$probe", method="${method}"})
          / 
          count by (probe) (probe_http_got_expected_response{job="$job", instance="$instance", ${labelName}="${labelValue}", probe=~"$probe", method="${method}"})`,
        legendFormat: '{{ probe }}',
        range: false,
        refId: 'A',
      },
    ],
  });
}

export function getExpectedResponse(metrics: DataSourceRef, labelName: string, labelValue: string, method: string) {
  return new SceneFlexItem({
    body: new ExplorablePanel({
      $data: getQueryRunner(metrics, labelName, labelValue, method),
      pluginId: 'timeseries',
      title: 'Expected response by probe for ' + labelValue + ' ' + method,
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
