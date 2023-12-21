import { SceneFlexItem, SceneFlexLayout, SceneQueryRunner } from '@grafana/scenes';
import { DataSourceRef } from '@grafana/schema';

import { ExplorablePanel } from 'scenes/ExplorablePanel';

function getQueryRunner(metrics: DataSourceRef, name: string) {
  return new SceneQueryRunner({
    datasource: metrics,
    queries: [
      {
        expr: `
          count_over_time (
            {job="$job", instance="$instance"}
            | logfmt check, value, msg, probe
            | __error__ = ""
            | msg = "check result"
            | value = "1"
            | check = "${name}"
            | keep probe
            [5m]
          )
          / 
          count_over_time  (
              {job="$job", instance="$instance"}
              | logfmt check, msg, probe
              | __error__ = ""
              | msg = "check result"
              | check = "${name}"
              | keep probe
              [5m]
            )
        `,
        refId: 'A',
        queryType: 'range',
        hide: false,
        legendFormat: '{{ probe }}',
      },
    ],
  });
}

export function getSuccessOverTimeByProbe(metrics: DataSourceRef, name: string) {
  return new SceneFlexLayout({
    height: 400,
    children: [
      new SceneFlexItem({
        body: new ExplorablePanel({
          $data: getQueryRunner(metrics, name),
          options: {
            range: true,
          },
          fieldConfig: {
            defaults: {
              unit: 'percentunit',
            },
            overrides: [],
          },
          title: 'Success rate by probe for ' + name,
          pluginId: 'timeseries',
        }),
      }),
    ],
  });
}
