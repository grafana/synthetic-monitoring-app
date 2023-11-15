import {
  EmbeddedScene,
  SceneApp,
  SceneAppPage,
  SceneFlexItem,
  SceneFlexLayout,
  SceneQueryRunner,
  SceneTimeRange,
  sceneUtils,
  VizPanel,
} from '@grafana/scenes';

import { Check, DashboardSceneAppConfig, ROUTES } from 'types';
import { PLUGIN_URL_PATH } from 'components/constants';

import { ScriptedCheckDataSource } from './scriptedCheckDatasource';

const dsUID = 'sm-scripted-checks-ds';

export function getScriptedChecksScene({ metrics, logs }: DashboardSceneAppConfig, checks: Check[]): () => SceneApp {
  return () => {
    const timeRange = new SceneTimeRange({
      from: 'now-6h',
      to: 'now',
    });

    sceneUtils.registerRuntimeDataSource({
      dataSource: new ScriptedCheckDataSource(dsUID, dsUID),
    });

    const queryRunner = new SceneQueryRunner({
      datasource: { uid: '-- Mixed --' },
      queries: [
        {
          refId: 'scriptedChecks',
          datasource: { uid: dsUID, type: dsUID },
          targets: [{ checks }],
        },
      ],
    });

    return new SceneApp({
      pages: [
        new SceneAppPage({
          title: 'Scripted checks',
          hideFromBreadcrumbs: true,
          url: `${PLUGIN_URL_PATH}${ROUTES.ScriptedChecks}`,
          getScene: () => {
            return new EmbeddedScene({
              $timeRange: timeRange,
              body: new SceneFlexLayout({
                direction: 'column',
                children: [
                  new SceneFlexItem({
                    body: new VizPanel({
                      $data: queryRunner,
                      // new SceneDataNode({
                      //   data: {
                      //     state: LoadingState.Done,
                      //     timeRange: { from: dateTime(), to: dateTime(), raw: { from: 'now-6h', to: 'now' } },
                      //     series: [dataFrame],
                      //   },
                      // }),
                      pluginId: 'table',
                      title: '',
                    }),
                  }),
                ],
              }),
            });
          },
        }),
      ],
    });
  };
}
