import { SceneFlexItem, SceneQueryRunner, VizPanel } from '@grafana/scenes';
import { DataSourceRef, ThresholdsMode } from '@grafana/schema';

function getQueryRunner(metrics: DataSourceRef) {
  return new SceneQueryRunner({
    datasource: metrics,
    queries: [
      {
        refId: 'A',
        expr: 'probe_success{probe=~"${probe}", job="${job}", instance="${instance}"}',
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
      options: {
        reduceOptions: {
          values: false,
          calcs: ['mean'],
        },
        orientation: 'auto',
        textMode: 'auto',
        colorMode: 'value',
        graphMode: 'area',
        justifyMode: 'auto',
      },
    }),
  });
}
