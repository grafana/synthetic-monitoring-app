import { SceneQueryRunner, VizPanel } from '@grafana/scenes';
import { DataSourceRef } from '@grafana/schema';

function getQueryRunner(sm: DataSourceRef) {
  return new SceneQueryRunner({
    datasource: sm,
    queries: [
      {
        instance: '$instance',
        probe: '$probe',
        job: '$job',
        queryType: 'traceroute',
        refId: 'A',
      },
    ],
  });
}

export function getNodeGraphPanel(sm: DataSourceRef) {
  const nodeGraph = new VizPanel({
    description: 'Shows all the routes a check takes to the destination',
    $data: getQueryRunner(sm),
    title: 'Traceroute path',
    pluginId: 'nodeGraph',
  });
  return nodeGraph;
}
