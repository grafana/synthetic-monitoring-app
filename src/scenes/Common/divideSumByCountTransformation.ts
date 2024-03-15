import { SceneDataTransformer, SceneQueryRunner } from '@grafana/scenes';

export function divideSumByCountTransformation(runner: SceneQueryRunner) {
  return new SceneDataTransformer({
    $data: runner,
    transformations: [
      {
        id: 'reduce',
        options: {
          labelsToFields: false,
          reducers: ['sum'],
        },
      },
      {
        id: 'rowsToFields',
        options: {
          mappings: [
            {
              fieldName: 'Total',
              handlerKey: 'field.value',
            },
          ],
        },
      },
      {
        id: 'calculateField',
        options: {
          binary: {
            left: 'sum',
            operator: '/',
            right: 'count',
          },
          mode: 'binary',
          reduce: {
            reducer: 'sum',
          },
        },
      },
      {
        id: 'organize',
        options: {
          excludeByName: {
            count: true,
            sum: true,
          },
          includeByName: {},
          indexByName: {},
          renameByName: {},
        },
      },
    ],
  });
}
