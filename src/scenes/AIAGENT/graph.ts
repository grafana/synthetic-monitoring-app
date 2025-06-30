import { SceneQueryRunner } from '@grafana/scenes';

import { ExplorablePanel } from 'scenes/ExplorablePanel';

function getQueryRunner() {
  return new SceneQueryRunner({
    datasource: {
      type: 'grafana-testdata-datasource',
      uid: 'feqhyl130stfkb',
    },
    queries: [
      {
        scenarioId: 'node_graph',
        refId: 'B',
      },
    ],
  });
}

export function getGraphPanel() {
  return new ExplorablePanel({
    pluginId: 'nodeGraph',
    title: 'Explored nodes',
    description: 'Nodes explored by the AI agent',
    $data: getQueryRunner(),
    fieldConfig: {
      defaults: {},
      overrides: [],
    },

    options: {
      edges: {},
      layoutAlgorithm: 'layered',
      nodes: {},
      zoomMode: 'cooperative',
    },
  });
}
