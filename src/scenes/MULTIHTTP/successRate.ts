import { DataSourceRef } from '@grafana/data';
import { SceneFlexItem, SceneQueryRunner, VizPanel } from '@grafana/scenes';
import { ThresholdsMode } from '@grafana/schema';

function getQueryRunner(metrics: DataSourceRef) {
  return new SceneQueryRunner({
    datasource: metrics,
    queries: [
      {
        refId: 'A',
        editorMode: 'builder',
        expr: 'probe_success{job="aghaha", instance="http://www.example.com"}',
        legendFormat: '__auto',
        range: true,
        datasource: metrics,
      },
    ],
  });
}

export function getSuccessRatePanel(metrics: DataSourceRef) {
  return new SceneFlexItem({
    width: 200,
    body: new VizPanel({
      $data: getQueryRunner(metrics),
      pluginId: 'stat',
      title: 'Success rate',
      fieldConfig: {
        defaults: {
          mappings: [],
          thresholds: {
            mode: ThresholdsMode.Absolute,
            steps: [
              {
                color: 'green',
                value: 0,
              },
              {
                color: 'red',
                value: 80,
              },
            ],
          },
          color: {
            mode: 'thresholds',
          },
          unit: 'percentunit',
        },
        overrides: [],
      },
    }),
  });
}
