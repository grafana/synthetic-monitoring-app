import { SceneDataTransformer, SceneQueryRunner } from '@grafana/scenes';
import { DataSourceRef } from '@grafana/schema';
import { ExplorablePanel } from 'scenes/ExplorablePanel';

function getQueryRunner(logs: DataSourceRef) {
  const queryRunner = new SceneQueryRunner({
    datasource: logs,
    maxDataPoints: 1,
    queries: [
      {
        expr: 'sum by (Hosts) (count_over_time({check_name="traceroute", job="$job", instance="$instance", probe=~"$probe"} | logfmt | Hosts != "" [$__interval]))',
        instant: true,
        // legendFormat: '',
        // range: true,
        refId: 'A',
      },
    ],
  });

  const transformed = new SceneDataTransformer({
    $data: queryRunner,
    transformations: [
      {
        id: 'organize',
        options: {
          excludeByName: {
            Time: true,
          },
          indexByName: {},
          renameByName: {},
        },
      },
    ],
  });

  return transformed;
}

export function getCommonHostsPanel(logs: DataSourceRef) {
  const nodeGraph = new ExplorablePanel({
    $data: getQueryRunner(logs),
    title: 'Common hosts',
    pluginId: 'table',
    fieldConfig: {
      defaults: {
        custom: {
          align: 'auto',
          cellOptions: {
            type: 'auto',
          },
          inspect: false,
          filterable: true,
        },
        mappings: [],
      },
      overrides: [
        {
          matcher: {
            id: 'byName',
            options: 'Value #A',
          },
          properties: [
            {
              id: 'displayName',
              value: 'Times Transited',
            },
          ],
        },
        {
          matcher: {
            id: 'byName',
            options: 'Host',
          },
          properties: [
            {
              id: 'custom.width',
              value: 221,
            },
          ],
        },
        {
          matcher: {
            id: 'byName',
            options: 'Hosts',
          },
          properties: [
            {
              id: 'custom.width',
              value: 214,
            },
          ],
        },
      ],
    },
    options: {
      showHeader: true,
      footer: {
        show: false,
        reducer: ['sum'],
        countRows: false,
        fields: '',
      },
      frameIndex: 2,
      sortBy: [
        {
          desc: true,
          displayName: 'Times Transited',
        },
      ],
    },
  });
  return nodeGraph;
}
