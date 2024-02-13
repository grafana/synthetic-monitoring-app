import { SceneFlexItem, SceneQueryRunner } from '@grafana/scenes';
import { DataSourceRef } from '@grafana/schema';

import { ExplorablePanel } from 'scenes/ExplorablePanel';

function getQueryRunner(metrics: DataSourceRef) {
  return new SceneQueryRunner({
    queries: [
      {
        refId: 'A',
        editorMode: 'code',
        expr: 'sum by (probe) (probe_http_total_duration_seconds{probe=~"${probe}", job="${job}", instance="${instance}"})',
        legendFormat: '__auto',
        range: true,
      },
      // {
      //   expr: 'max(ALERTS{probe=~"$probe", job="$job", instance="$instance"})',
      //   hide: false,
      //   instant: false,
      //   legendFormat: 'alert firing',
      //   range: true,
      //   refId: 'alerts',
      // },
    ],
    datasource: metrics,
  });
}

export function getProbeDuration(metrics: DataSourceRef) {
  return new SceneFlexItem({
    body: new ExplorablePanel({
      $data: getQueryRunner(metrics),
      pluginId: 'timeseries',
      title: 'Duration by probe',
      fieldConfig: {
        defaults: {
          unit: 's',
        },
        overrides: [],
        // overrides: [
        //   {
        //     matcher: {
        //       id: 'byName',
        //       options: 'alert firing',
        //     },
        //     properties: [
        //       {
        //         id: 'custom.lineStyle',
        //         value: {
        //           dash: [10, 10],
        //           fill: 'dash',
        //         },
        //       },
        //       {
        //         id: 'custom.fillOpacity',
        //         value: 25,
        //       },
        //       {
        //         id: 'color',
        //         value: {
        //           mode: 'fixed',
        //           fixedColor: 'dark-red',
        //         },
        //       },
        //     ],
        //   },
        // ],
      },
    }),
  });
}
