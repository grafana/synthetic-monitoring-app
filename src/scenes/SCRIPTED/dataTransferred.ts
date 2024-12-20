import { SceneFlexItem, SceneFlexLayout, SceneQueryRunner } from '@grafana/scenes';
import { DataSourceRef } from '@grafana/schema';

import { ExplorablePanel } from 'scenes/ExplorablePanel';

function getSentQueryRunner(metrics: DataSourceRef) {
  return new SceneQueryRunner({
    datasource: metrics,
    queries: [
      {
        expr: `probe_data_sent_bytes{probe=~"$probe", job="$job", instance="$instance"}`,
        instant: false,
        legendFormat: '{{ probe }}',
        range: true,
        refId: 'B',
      },
    ],
  });
}

function getReceivedQueryRunner(metrics: DataSourceRef) {
  return new SceneQueryRunner({
    datasource: metrics,
    queries: [
      {
        expr: `probe_data_received_bytes{probe=~"$probe", job="$job", instance="$instance"}`,
        instant: false,
        legendFormat: '{{ probe }}',
        range: true,
        refId: 'A',
      },
    ],
  });
}

export function getDataTransferred(metrics: DataSourceRef) {
  return new SceneFlexLayout({
    height: 200,
    children: [
      new SceneFlexItem({
        width: '50%',
        body: new ExplorablePanel({
          $data: getSentQueryRunner(metrics),
          pluginId: 'timeseries',
          title: 'Data sent',
          fieldConfig: {
            defaults: {
              unit: 'decbytes',
            },
            overrides: [],
          },
        }),
      }),
      new SceneFlexItem({
        width: '50%',
        body: new ExplorablePanel({
          $data: getReceivedQueryRunner(metrics),
          pluginId: 'timeseries',
          title: 'Data received',
          fieldConfig: {
            defaults: {
              unit: 'decbytes',
            },
            overrides: [],
          },
        }),
      }),
    ],
  });
}
