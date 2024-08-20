import { PanelBuilders, SceneFlexItem, SceneFlexLayout, SceneQueryRunner } from '@grafana/scenes';
import { DataSourceRef, GraphDrawStyle } from '@grafana/schema';

function getQueryRunner(metrics: DataSourceRef) {
  return new SceneQueryRunner({
    datasource: metrics,
    queries: [
      {
        refId: 'A',
        expr: `sum by (job, instance) (quantile_over_time(0.75, probe_browser_web_vital_fid{instance="$instance", job="$job"}[$__rate_interval]))`,
        legendFormat: 'FID',
      },
      {
        refId: 'B',
        expr: `sum by (job, instance) (quantile_over_time(0.75, probe_browser_web_vital_inp{instance="$instance", job="$job"}[$__rate_interval]))`,
        legendFormat: 'INP',
      },
    ],
  });
}

export function getInputResponseTime(metrics: DataSourceRef) {
  return new SceneFlexLayout({
    direction: 'column',
    $data: getQueryRunner(metrics),
    children: [
      new SceneFlexLayout({
        direction: 'row',
        height: 200,
        children: [
          new SceneFlexItem({
            body: PanelBuilders.timeseries()
              .setTitle('Input Response Time (FID, INP) - p75')
              .setDescription('')
              .setCustomFieldConfig('drawStyle', GraphDrawStyle.Line)
              .setCustomFieldConfig('fillOpacity', 10)
              .setCustomFieldConfig('spanNulls', true)
              .setCustomFieldConfig('pointSize', 5)
              .setUnit('ms')
              .build(),
          }),
        ],
      }),
    ],
  });
}
