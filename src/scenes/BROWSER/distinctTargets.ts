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
            probe_browser_web_vital_fcp{probe=~"\${probe}", job="\${job}", instance="\${instance}"}
          )
        )`,
        instant: true,
        legendFormat: '__auto',
        range: false,
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
      title: 'Distinct targets',
    }),
  });
}
