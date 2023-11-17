import {
  EmbeddedScene,
  SceneApp,
  SceneAppPage,
  SceneDataTransformer,
  SceneFlexItem,
  SceneFlexLayout,
  SceneQueryRunner,
  SceneTimeRange,
} from '@grafana/scenes';

import { Check, DashboardSceneAppConfig, ROUTES } from 'types';
import { QueryType } from 'datasource/types';
import { PLUGIN_URL_PATH } from 'components/constants';
import { ScriptedChecksListSceneObject } from 'components/ScriptedCheckList';

export function getScriptedChecksScene({ metrics, logs, sm }: DashboardSceneAppConfig, checks: Check[]) {
  const timeRange = new SceneTimeRange({
    from: 'now-6h',
    to: 'now',
  });

  const queryRunner = new SceneQueryRunner({
    datasource: { uid: '-- Mixed --' },
    queries: [
      {
        datasource: { uid: sm.uid },
        refId: 'scriptedChecks',
        queryType: QueryType.ScriptedChecks,
        checks,
      },
      {
        datasource: metrics,
        editorMode: 'code',
        exemplar: false,
        expr: `
          # find the average uptime over the entire time range evaluating 'up' in 5 minute windows
          avg_over_time(
            (
              # the inner query is going to produce a non-zero value if there was at least one successful check during the 5 minute window
              # so make it a 1 if there was at least one success and a 0 otherwise
              ceil(
                # the number of successes across all probes
                sum by (instance, job) (increase(probe_all_success_sum{}[5m]) * on (instance, job, probe, config_version) sm_check_info{check_name=~"k6" })
                /
                # the total number of times we checked across all probes
                (sum by (instance, job) (increase(probe_all_success_count[5m])) + 1) # + 1 because we want to make sure it goes to 1, not 2
              )
            )
            [$__range:5m]
          )
        `,
        format: 'table',
        hide: false,
        instant: true,
        interval: '',
        legendFormat: '',
        refId: 'uptime',
      },
      {
        datasource: metrics,
        expr: `
            sum by (instance, job)
            (
              rate(probe_all_success_sum[$__range])
              *
              on (instance, job, probe, config_version) group_left(check_name) max by (instance, job, probe, config_version, check_name) (sm_check_info{check_name=~"k6" })
            )
            /
            sum by (instance, job)
            (
              rate(probe_all_success_count[$__range])
              *
              on (instance, job, probe, config_version) group_left(check_name) max by (instance, job, probe, config_version, check_name) (sm_check_info{check_name=~"k6"})
            )`,
        format: 'table',
        instant: true,
        interval: '',
        legendFormat: '{{check_name}}-{{instance}}-uptime',
        refId: 'reachability',
      },
      {
        datasource: metrics,
        editorMode: 'code',
        exemplar: false,
        expr: `
          ceil(
            sum by (instance, job)
            (
              rate(probe_all_success_sum[5m])
              *
              on (instance, job, probe, config_version) group_left(check_name) max by (instance, job, probe, config_version, check_name) (sm_check_info{check_name=~"k6" })
            )
            /
            sum by (instance, job)
            (
              rate(probe_all_success_count[5m])
              *
              on (instance, job, probe, config_version) group_left(check_name) max by (instance, job, probe, config_version, check_name) (sm_check_info{check_name=~"k6" })
            )
          )
        `,
        format: 'table',
        hide: false,
        instant: true,
        interval: '',
        legendFormat: '{{check_name}}-{{instance}}-uptime',
        refId: 'state',
      },
    ],
  });

  const transformed = new SceneDataTransformer({
    $data: queryRunner,
    transformations: [
      {
        id: 'merge',
        options: {},
      },
      {
        id: 'organize',
        options: {
          excludeByName: {
            Time: true,
            id: true,
            // check_name: false,
          },
          indexByName: {
            Time: 0,
            job: 1,
            instance: 2,
            probes: 4,
            'Value #state': 5,
            // 'Value #latency': 7,
            // 'Value #state': 4,
            'Value #uptime': 6,
            'Value #reachability': 7,
          },
          // renameByName: {
          //   'Value #': 'check type',
          // },
        },
      },
    ],
  });

  return new SceneApp({
    pages: [
      new SceneAppPage({
        title: 'Scripted checks',
        // hideFromBreadcrumbs: true,
        url: `${PLUGIN_URL_PATH}${ROUTES.ScriptedChecks}`,
        getScene: () => {
          return new EmbeddedScene({
            $timeRange: timeRange,
            body: new SceneFlexLayout({
              direction: 'column',
              children: [
                new SceneFlexItem({
                  $data: transformed,
                  body: new ScriptedChecksListSceneObject({}),
                }),
              ],
            }),
          });
        },
      }),
    ],
  });
}
