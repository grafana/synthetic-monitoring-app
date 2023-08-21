import { SceneDataTransformer, SceneFlexItem, SceneQueryRunner } from '@grafana/scenes';
import { DataSourceRef, ThresholdsMode } from '@grafana/schema';
import { ExplorablePanel } from 'scenes/ExplorablePanel';

function getQueryRunner(logs: DataSourceRef) {
  const query = new SceneQueryRunner({
    datasource: logs,
    queries: [
      {
        editorMode: 'code',
        expr: 'sum (\n    min_over_time (\n        {job="$job", instance="$instance"}\n        | logfmt method, url, check, value, msg\n        | __error__ = ""\n        | msg = "check result"\n        | unwrap value\n        [$__range]\n    )\n) by (method, url, check)\n/\ncount (\n    min_over_time (\n        {job="$job", instance="$instance"}\n        | logfmt method, url, check, value, msg\n        | __error__ = ""\n        | msg = "check result"\n        | unwrap value\n        [$__range]\n    )\n) by (method, url, check)',
        queryType: 'instant',
        refId: 'A',
      },
    ],
  });

  return new SceneDataTransformer({
    $data: query,
    transformations: [
      {
        id: 'organize',
        options: {
          excludeByName: {
            Time: true,
          },
          indexByName: {},
          renameByName: {
            'Value #A': 'success rate',
          },
        },
      },
    ],
  });
}

export function getAssertionTable(logs: DataSourceRef) {
  return new SceneFlexItem({
    body: new ExplorablePanel({
      $data: getQueryRunner(logs),
      pluginId: 'table',
      title: 'Assertions',
      fieldConfig: {
        defaults: {
          custom: {
            align: 'auto',
            cellOptions: {
              type: 'auto',
            },
            inspect: false,
          },
          mappings: [],
          thresholds: {
            mode: ThresholdsMode.Absolute,
            steps: [
              {
                color: 'red',
                value: 0,
              },
              {
                color: 'green',
                value: 1,
              },
            ],
          },
          color: {
            fixedColor: 'green',
            mode: 'fixed',
          },
        },
        overrides: [
          {
            matcher: {
              id: 'byName',
              options: 'success rate',
            },
            properties: [
              {
                id: 'custom.cellOptions',
                value: {
                  mode: 'basic',
                  type: 'color-background',
                },
              },
              {
                id: 'unit',
                value: 'percentunit',
              },
              {
                id: 'thresholds',
                value: {
                  mode: 'absolute',
                  steps: [
                    {
                      color: 'red',
                      value: null,
                    },
                    {
                      color: 'green',
                      value: 1,
                    },
                  ],
                },
              },
              {
                id: 'color',
              },
            ],
          },
        ],
      },
      options: {
        showHeader: true,
        cellHeight: 'sm',
        footer: {
          show: false,
          reducer: ['sum'],
          countRows: false,
          fields: '',
        },
      },
    }),
  });
}
