import { SceneQueryRunner, SceneVariableSet, VizPanel } from '@grafana/scenes';
import { DataSourceRef } from '@grafana/schema';

function getQueryRunner(variables: SceneVariableSet, sm: DataSourceRef) {
  // const instance = variables.getByName('instance');
  // console.log('hiioooooooii', instance?.getValue());
  return new SceneQueryRunner({
    datasource: sm,
    $variables: variables,
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

export function getNodeGraphPanel(variables: SceneVariableSet, sm: DataSourceRef) {
  const nodeGraph = new VizPanel({
    description: 'Shows all the routes a check takes to the destination',
    // $variables: variables,
    $data: getQueryRunner(variables, sm),
    title: 'Traceroute path',
    pluginId: 'nodeGraph',
  });
  return nodeGraph;
}
