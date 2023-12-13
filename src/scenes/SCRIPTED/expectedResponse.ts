import { SceneFlexItem, SceneQueryRunner } from '@grafana/scenes';
import { DataSourceRef } from '@grafana/schema';

import { ExplorablePanel } from 'scenes/ExplorablePanel';

function getQueryRunner(metrics: DataSourceRef) {
  return new SceneQueryRunner({
    datasource: metrics,
    queries: [
      {
        expr: `
          sum by (name) (probe_http_got_expected_response{job="$job", instance="$instance"})
          / 
          count by (name) (probe_http_got_expected_response{job="$job", instance="$instance"})`,
        format: 'table',
        instant: true,
        legendFormat: '{{ name }}',
        range: false,
        refId: 'B',
      },
    ],
  });
}

export function getExpectedResponse(metrics: DataSourceRef) {
  return new SceneFlexItem({
    body: new ExplorablePanel({
      $data: getQueryRunner(metrics),
      pluginId: 'table',
      title: 'Expected response by target',
      fieldConfig: {
        defaults: {
          unit: 'percentunit',
        },
        overrides: [
          {
            matcher: {
              id: 'byName',
              options: 'Time',
            },
            properties: [
              {
                id: 'custom.hidden',
                value: true,
              },
            ],
          },
          {
            matcher: {
              id: 'byName',
              options: 'Value',
            },
            properties: [
              {
                id: 'displayName',
                value: 'Expected status received',
              },
            ],
          },
        ],
      },
    }),
  });
}
