import {
  CustomVariable,
  EmbeddedScene,
  QueryVariable,
  SceneApp,
  SceneAppPage,
  SceneAppPageLike,
  SceneControlsSpacer,
  SceneDataTransformer,
  SceneFlexItem,
  SceneFlexLayout,
  sceneGraph,
  SceneQueryRunner,
  SceneReactObject,
  SceneRefreshPicker,
  SceneRouteMatch,
  SceneTimeRange,
  SceneVariableSet,
  VariableValueSelectors,
} from '@grafana/scenes';
import { VariableHide, VariableRefresh } from '@grafana/schema';
import { LinkButton } from '@grafana/ui';

import { Check, DashboardSceneAppConfig, ROUTES } from 'types';
import { QueryType } from 'datasource/types';
import { CheckEditor } from 'components/CheckEditor';
import { PLUGIN_URL_PATH } from 'components/constants';
import { ScriptedChecksListSceneObject } from 'components/ScriptedCheckList/ScriptedCheckList';
import { getLatencyByProbePanel, getReachabilityStat, getUptimeStat } from 'scenes/Common';

import { getScriptedLatencyByUrl } from '../Scripted/getScriptedLatencyByUrl';
import { getUpStatusOverTime } from '../Scripted/getUpStatusOverTime';

export function getChecksDrilldownScene({ metrics, logs, sm }: DashboardSceneAppConfig, checks: Check[]) {
  const timeRange = new SceneTimeRange({
    from: 'now-6h',
    to: 'now',
  });

  const queryRunner = new SceneQueryRunner({
    datasource: { uid: '-- Mixed --' },
    queries: [
      {
        datasource: { uid: sm.uid },
        refId: 'checks',
        queryType: QueryType.Checks,
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
                sum by (instance, job) (increase(probe_all_success_sum{}[5m]) * on (instance, job, probe, config_version) sm_check_info{check_name=~".*" })
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
              on (instance, job, probe, config_version) group_left(check_name) max by (instance, job, probe, config_version, check_name) (sm_check_info{check_name=~".*" })
            )
            /
            sum by (instance, job)
            (
              rate(probe_all_success_count[$__range])
              *
              on (instance, job, probe, config_version) group_left(check_name) max by (instance, job, probe, config_version, check_name) (sm_check_info{check_name=~".*"})
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
              on (instance, job, probe, config_version) group_left(check_name) max by (instance, job, probe, config_version, check_name) (sm_check_info{check_name=~".*" })
            )
            /
            sum by (instance, job)
            (
              rate(probe_all_success_count[5m])
              *
              on (instance, job, probe, config_version) group_left(check_name) max by (instance, job, probe, config_version, check_name) (sm_check_info{check_name=~".*" })
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
      {
        datasource: metrics,
        expr: `
          sum by (instance, job)(
            (
              rate(probe_all_duration_seconds_sum{probe=~".*"}[$__range])
            )
          ) /
          sum by (instance, job)(
            (
              rate(probe_all_duration_seconds_count{probe=~".*"}[$__range])
            )
          )
        `,
        format: 'table',
        hide: false,
        instant: true,
        interval: '',
        refId: 'latency-protocol',
      },
      {
        datasource: metrics,
        expr: `
          sum by (job, instance) (
            sum_over_time(
              probe_http_total_duration_seconds{probe=~".*"}[$__range])
            ) 
          / 
          sum by (job, instance) (
            count_over_time(probe_http_total_duration_seconds{probe=~".*"}[$__range])
          )
        `,
        format: 'table',
        hide: false,
        instant: true,
        interval: '',
        refId: 'latency-k6',
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
            'Value #latency-protocol': 8,
            'Value #uptime': 6,
            'Value #reachability': 7,
            'Value #latency-k6': 9,
          },
          // renameByName: {
          //   'Value #': 'check type',
          // },
        },
      },
    ],
  });

  return new SceneApp({
    $data: transformed,
    pages: [
      new SceneAppPage({
        title: 'Checks',
        // $variables: variables,
        url: `${PLUGIN_URL_PATH}${ROUTES.Checks}`,
        drilldowns: [
          {
            routePath: `${PLUGIN_URL_PATH}${ROUTES.Checks}/:id/edit`,
            getPage: getEditCheckPage(),
          },
          {
            routePath: `${PLUGIN_URL_PATH}${ROUTES.Checks}/:id`,
            getPage: getCheckDrilldownPage({ metrics, logs, sm }),
          },
        ],
        getScene: () => {
          return new EmbeddedScene({
            $timeRange: timeRange,
            body: new SceneFlexLayout({
              direction: 'column',
              children: [
                new SceneFlexItem({
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

function getEditCheckPage() {
  return function (routeMatch: SceneRouteMatch<{ id: string }>, parent: SceneAppPageLike) {
    const checkId = decodeURIComponent(routeMatch.params.id);
    const page = new SceneAppPage({
      // $variables: new SceneVariableSet({ variables: [probes, job, instance] }),
      url: routeMatch.url,
      getParentPage: () => parent,
      // title: `${job.getValue()} overview`,
      title: 'Edit check',
      getScene: () => getEditCheckScene(checkId),
    });

    page.addActivationHandler(() => {
      console.log('activating');
      const sub = sceneGraph.getData(page).subscribeToState((state) => {
        const fields = state.data?.series?.[0]?.fields;
        const checkIdFieldIndex = fields?.findIndex((field) => field.name === 'checkId');
        if (checkIdFieldIndex === -1 || checkIdFieldIndex === undefined) {
          return;
        }
        const checkIndex = fields?.[checkIdFieldIndex]?.values?.findIndex((id: number) => String(id) === checkId);
        if (checkIndex === -1 || checkIndex === undefined) {
          return;
        }
        const jobIndex = fields?.findIndex((field) => field.name === 'job');
        if (jobIndex === -1 || jobIndex === undefined) {
          return;
        }
        const jobVal = fields?.[jobIndex]?.values?.[checkIndex];
        const instanceIndex = fields?.findIndex((field) => field.name === 'instance');
        if (instanceIndex === -1 || instanceIndex === undefined) {
          return;
        }
        const instanceVal = fields?.[instanceIndex]?.values?.[checkIndex];
        if (!jobVal || !instanceVal) {
          return;
        }
        console.log('updting job, instance', {
          jobVal,
          instanceVal,
        });
        page.setState({ title: `Edit ${jobVal} check` });
      });
      return () => sub.unsubscribe();
    });
    return page;
  };
}

function getEditCheckScene(checkId: string) {
  const scene = new EmbeddedScene({
    body: new SceneReactObject({
      component: CheckEditor,
      props: {
        checkId,
        onReturn: () => {
          console.log('oh to return');
        },
      },
    }),
  });

  return scene;
}

function getCheckDrilldownPage(config: DashboardSceneAppConfig) {
  return function (routeMatch: SceneRouteMatch<{ id: string }>, parent: SceneAppPageLike) {
    // Retrieve handler from the URL params.
    const checkId = decodeURIComponent(routeMatch.params.id);
    const job = new CustomVariable({
      name: 'job',
      skipUrlSync: true,
      loading: true,
      hide: VariableHide.hideVariable,
    });
    const instance = new CustomVariable({
      name: 'instance',
      hide: VariableHide.hideVariable,
      loading: true,
      skipUrlSync: true,
    });
    const probes = new QueryVariable({
      includeAll: true,
      allValue: '.*',
      defaultToAll: true,
      isMulti: true,
      name: 'probe',
      query: `label_values(sm_check_info{},probe)`,
      refresh: VariableRefresh.onDashboardLoad,
      datasource: config.metrics,
    });

    const page = new SceneAppPage({
      $variables: new SceneVariableSet({ variables: [probes, job, instance] }),
      url: `${PLUGIN_URL_PATH}${ROUTES.Checks}/${encodeURIComponent(checkId)}`,
      getParentPage: () => parent,
      title: `${job.getValue()} overview`,
      getScene: () => getCheckDrilldownScene(config, checkId),
    });

    page.addActivationHandler(() => {
      console.log('activating');
      const sub = sceneGraph.getData(parent).subscribeToState((state) => {
        const fields = state.data?.series?.[0]?.fields;
        const checkIdFieldIndex = fields?.findIndex((field) => field.name === 'checkId');
        if (checkIdFieldIndex === -1 || checkIdFieldIndex === undefined) {
          return;
        }
        const checkIndex = fields?.[checkIdFieldIndex]?.values?.findIndex((id: number) => String(id) === checkId);
        if (checkIndex === -1 || checkIndex === undefined) {
          return;
        }
        const jobIndex = fields?.findIndex((field) => field.name === 'job');
        if (jobIndex === -1 || jobIndex === undefined) {
          return;
        }
        const jobVal = fields?.[jobIndex]?.values?.[checkIndex];
        const instanceIndex = fields?.findIndex((field) => field.name === 'instance');
        if (instanceIndex === -1 || instanceIndex === undefined) {
          return;
        }
        const instanceVal = fields?.[instanceIndex]?.values?.[checkIndex];
        if (!jobVal || !instanceVal) {
          return;
        }
        if (job.getValue() !== jobVal || instance.getValue() !== instanceVal) {
          console.log('updting job, instance', {
            jobVal,
            instanceVal,
            job: job.getValue(),
            instance: instance.getValue(),
          });
          instance.changeValueTo(instanceVal);
          job.changeValueTo(jobVal);
          page.setState({ title: `${jobVal} overview` });
          job.setState({ loading: false });
          instance.setState({ loading: false });
        }
      });
      return () => sub.unsubscribe();
    });
    return page;
  };

  function getCheckDrilldownScene({ metrics }: DashboardSceneAppConfig, checkId: string) {
    const upStatusOverTime = getUpStatusOverTime(metrics);
    const uptime = getUptimeStat(metrics);
    const reachability = getReachabilityStat(metrics);

    const latencyByProbe = getLatencyByProbePanel(metrics);

    const latencyByUrl = getScriptedLatencyByUrl(metrics);

    const a = new EmbeddedScene({
      controls: [
        new VariableValueSelectors({}),
        new SceneControlsSpacer(),
        new SceneRefreshPicker({
          intervals: ['5s', '1m', '1h'],
          isOnCanvas: true,
          refresh: '1m',
        }),
        new SceneReactObject({
          // component: EditCheckDrawer,
          // props: {
          //   checkId: checkId,
          //   onClose: () => sceneGraph.getTimeRange(latencyByProbe).onRefresh(),
          // },
          component: LinkButton,
          props: {
            children: 'Edit check',
            href: `${PLUGIN_URL_PATH}${ROUTES.Checks}/${encodeURIComponent(checkId)}/edit`,
          },
        }),
      ],
      body: new SceneFlexLayout({
        direction: 'row',
        children: [
          new SceneFlexItem({
            minHeight: 300,
            body: new SceneFlexLayout({
              direction: 'column',
              children: [
                new SceneFlexLayout({
                  direction: 'row',
                  height: 150,
                  children: [new SceneFlexItem({ body: uptime }), new SceneFlexItem({ body: reachability })],
                }),
                new SceneFlexLayout({
                  direction: 'row',
                  height: 150,
                  children: [new SceneFlexItem({ body: upStatusOverTime })],
                }),
                new SceneFlexLayout({
                  direction: 'row',
                  height: 400,
                  children: [new SceneFlexItem({ body: latencyByUrl }), new SceneFlexItem({ body: latencyByProbe })],
                }),
              ],
            }),
          }),
        ],
      }),
    });

    a.addActivationHandler(() => {
      console.log('yaaargh');
      const sub = a.subscribeToState((state) => {
        console.log('subscribing', state);
      });
      return () => sub.unsubscribe();
    });

    return a;
  }
}
