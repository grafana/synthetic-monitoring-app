import { SceneFlexItem, SceneFlexLayout, SceneQueryRunner } from '@grafana/scenes';
import { DataSourceRef } from '@grafana/schema';

import { ExplorablePanel } from 'scenes/ExplorablePanel';

function getQueryRunner(metrics: DataSourceRef, name: string, minStep: string) {
  const escaped = name.replace(/"/g, '\\"');
  return new SceneQueryRunner({
    datasource: metrics,
    queries: [
      {
        expr: `
          count_over_time (
            {job="$job", instance="$instance", probe=~"$probe"}
            | logfmt check, value, msg, probe
            | __error__ = ""
            | msg = "check result"
            | value = "1"
            | check = "${escaped}"
            | keep probe
            [${minStep}]
          )
          / 
          count_over_time  (
              {job="$job", instance="$instance", probe=~"$probe"}
              | logfmt check, msg, probe
              | __error__ = ""
              | msg = "check result"
              | check = "${escaped}"
              | keep probe
              [${minStep}]
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

export function getSuccessOverTimeByProbe(metrics: DataSourceRef, name: string, minStep: string) {
  return new SceneFlexLayout({
    height: 400,
    children: [
      new SceneFlexItem({
        body: new ExplorablePanel({
          $data: getQueryRunner(metrics, name, minStep),
          options: {
            range: true,
          },
          fieldConfig: {
            defaults: {
              unit: 'percentunit',
              max: 1,
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
