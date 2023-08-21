import { SceneFlexItem, SceneQueryRunner } from '@grafana/scenes';
import { DataSourceRef } from '@grafana/schema';
import { ExplorablePanel } from 'scenes/ExplorablePanel';

function getQueryRunner(metrics: DataSourceRef) {
  return new SceneQueryRunner({
    datasource: metrics,
    queries: [
      {
        expr: `count by (job, target) (
          count by (url, method) (
            probe_http_info{probe=~"\${probe}", job="\${job}", instance="\${instance}"}
          )
        )`,
        instant: false,
        legendFormat: '__auto',
        range: true,
        refId: 'A',
      },
    ],
  });
}

export function getDistinctTargets(metrics: DataSourceRef) {
  return new SceneFlexItem({
    width: 200,
    body: new ExplorablePanel({
      $data: getQueryRunner(metrics),
      pluginId: 'stat',
      title: 'Number of distinct targets',
    }),
  });
}
