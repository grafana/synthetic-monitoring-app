import { SceneFlexItem, SceneFlexLayout, SceneQueryRunner } from '@grafana/scenes';
import { DataSourceRef, GraphDrawStyle } from '@grafana/schema';

import { ExplorablePanel } from 'scenes/ExplorablePanel';

function getQueryRunner(metrics: DataSourceRef) {
  return new SceneQueryRunner({
    datasource: metrics,
    queries: [
      {
        refId: 'A',
        expr: `avg by (instance, job) (quantile_over_time(0.75, probe_browser_web_vital_fcp{instance="$instance", job="$job", probe=~"$probe"}[$__range]))`,
        legendFormat: 'FCP',
      },
      {
        refId: 'B',
        expr: `avg by (instance, job) (quantile_over_time(0.75, probe_browser_web_vital_lcp{instance="$instance", job="$job", probe=~"$probe"}[$__range]))`,
        legendFormat: 'LCP',
      },
      {
        refId: 'C',
        expr: `avg by (instance, job) (quantile_over_time(0.75, probe_browser_web_vital_ttfb{instance="$instance", job="$job", probe=~"$probe"}[$__range]))`,
        legendFormat: 'TTFB',
      },
    ],
  });
}

export function getPageLoad(metrics: DataSourceRef) {
  return new SceneFlexLayout({
    direction: 'column',
    $data: getQueryRunner(metrics),
    children: [
      new SceneFlexLayout({
        direction: 'row',
        height: 200,
        children: [
          new SceneFlexItem({
            body: new ExplorablePanel({
              title: 'Page Load (TTFB, FCP, LCP) - p75',
              description: '',
              pluginId: 'timeseries',
              options: {
                tooltip: {
                  mode: 'multi',
                }
              },
              fieldConfig: {
                defaults: {
                  unit: 'ms',
                  custom: {
                    drawStyle: GraphDrawStyle.Line,
                    fillOpacity: 10,
                    spanNulls: true,
                    pointSize: 5,
                  },
                },
                overrides: [],
              },
            }),
          }),
        ],
      }),
    ],
  });
}
