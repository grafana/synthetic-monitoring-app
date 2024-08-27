import { DataTransformerID } from '@grafana/data';
import {
  PanelBuilders,
  SceneDataProvider,
  SceneDataState,
  SceneDataTransformer,
  SceneFlexItem,
  SceneFlexLayout,
  SceneQueryRunner,
} from '@grafana/scenes';
import { DataSourceRef } from '@grafana/schema';

const transformation = (queries: SceneDataProvider<SceneDataState>) => {
  return new SceneDataTransformer({
    transformations: [
      {
        id: DataTransformerID.timeSeriesTable,
        options: {
          stat: 'mean',
        },
      },
      /*{
        id: DataTransformerID.joinByField,
        options: {
          byField: 'url',
          mode: 'outer',
        },
      },*/
      {
        id: DataTransformerID.organize,
        options: {
          excludeByName: {},
          renameByName: {
            url: 'Page URL',
            'Trend #A': 'FCP',
            'Trend #B': 'LCP',
            'Trend #C': 'TTFB',
            'Trend #D': 'CLS',
            'Trend #E': 'FID',
            'Trend #F': 'INP',
          },
        },
      },
    ],
    $data: queries,
  });
};

function getQueryRunner(metrics: DataSourceRef) {
  const queries = new SceneQueryRunner({
    datasource: metrics,
    queries: [
      {
        refId: 'A',
        expr: `avg by (url) (quantile_over_time(0.75, probe_browser_web_vital_fcp{instance="$instance", job="$job"}[$__range]))`,
      },
      {
        refId: 'B',
        expr: `avg by (url) (quantile_over_time(0.75, probe_browser_web_vital_lcp{instance="$instance", job="$job"}[$__range]))`,
      },
      {
        refId: 'C',
        expr: `avg by (url) (quantile_over_time(0.75, probe_browser_web_vital_ttfb{instance="$instance", job="$job"}[$__range]))`,
      },
      {
        refId: 'D',
        expr: `avg by (url) (quantile_over_time(0.75, probe_browser_web_vital_cls{instance="$instance", job="$job"}[$__range]))`,
      },
      {
        refId: 'E',
        expr: `avg by (url) (quantile_over_time(0.75, probe_browser_web_vital_fid{instance="$instance", job="$job"}[$__range]))`,
      },
      {
        refId: 'F',
        expr: `avg by (url) (quantile_over_time(0.75, probe_browser_web_vital_inp{instance="$instance", job="$job"}[$__range]))`,
      },
    ],
  });

  return transformation(queries);
}

export function getWebVitalsTable(metrics: DataSourceRef) {
  const data = getQueryRunner(metrics);
  return new SceneFlexLayout({
    direction: 'column',
    $data: getQueryRunner(metrics),
    children: [
      new SceneFlexLayout({
        direction: 'row',
        height: 300,
        children: [
          new SceneFlexItem({
            body: PanelBuilders.table().setTitle('Metrics by url').setData(data).build(),
          }),
        ],
      }),
    ],
  });
}
