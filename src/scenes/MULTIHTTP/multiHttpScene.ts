import { VariableHide } from '@grafana/data';
import {
  CustomVariable,
  EmbeddedScene,
  SceneControlsSpacer,
  SceneFlexItem,
  SceneFlexLayout,
  SceneQueryRunner,
  SceneRefreshPicker,
  SceneTimePicker,
  SceneTimeRange,
  SceneVariableSet,
  VariableValueSelectors,
} from '@grafana/scenes';
import { Check, CheckType, DashboardSceneAppConfig, SceneBuilder } from 'types';
import { MultiHttpStepsScene } from './StepPickerScene';
import { getLatencyByPhasePanel } from './latencyByPhase';
import { getProbeDuration } from './probeDuration';
import { getReachabilityStat, getUptimeStat, getVariables } from 'scenes/Common';
import { getDistinctTargets } from './distinctTargets';
import { getLatencyByUrlPanel } from './latencyByUrl';
import { getAssertionLogsPanel } from './assertionLogs';
import { getErrorRateByUrl } from './errorRateByUrl';
import { getAssertionTable } from './assertionTable';
import { getEditButton } from 'scenes/Common/editButton';
import { getEmptyScene } from 'scenes/Common/emptyScene';

export function getMultiHttpScene({ metrics, logs }: DashboardSceneAppConfig, checks: Check[]): SceneBuilder {
  return () => {
    if (checks.length === 0) {
      return getEmptyScene(CheckType.MULTI_HTTP);
    }
    const timeRange = new SceneTimeRange({
      from: 'now-6h',
      to: 'now',
    });
    const { probe, job, instance } = getVariables(CheckType.MULTI_HTTP, metrics, checks);
    const stepUrl = new CustomVariable({
      name: 'stepUrl',
      hide: VariableHide.hideVariable,
    });
    const variables = new SceneVariableSet({
      variables: [probe, job, instance, stepUrl],
    });

    const resultsByUrl = new SceneQueryRunner({
      datasource: metrics,
      queries: [
        {
          refId: 'A',
          expr: `sum by (url) (
            probe_http_requests_failed_total{job="$job", instance="$instance"}
          )
          /
          sum by (url) (
            probe_http_requests_total{job="$job", instance="$instance"}
          )`,
          range: false,
          instant: true,
          editorMode: 'code',
          exemplar: false,
          format: 'table',
        },
      ],
    });

    const sidebar = new MultiHttpStepsScene({
      job: '',
      target: '',
      stepUrl: '',
      $data: resultsByUrl,
    });

    const latencyByPhase = getLatencyByPhasePanel(metrics);
    const latencyByUrl = getLatencyByUrlPanel(metrics);

    const body = new EmbeddedScene({
      body: new SceneFlexLayout({
        direction: 'column',
        children: [
          new SceneFlexLayout({
            direction: 'row',
            minHeight: 200,
            children: [latencyByUrl, latencyByPhase],
          }),
          getErrorRateByUrl(metrics),
        ],
      }),
    });

    sidebar.subscribeToState(({ stepUrl: value }) => {
      if (value && value !== stepUrl.getValue()) {
        stepUrl.changeValueTo(value);
      }
    });

    const reachability = getReachabilityStat(metrics);
    const uptime = getUptimeStat(metrics);
    const distinctTargets = getDistinctTargets(metrics);
    const probeDuration = getProbeDuration(metrics);

    const editButton = getEditButton({ job, instance });

    return new EmbeddedScene({
      $timeRange: timeRange,
      $variables: variables,
      controls: [
        new VariableValueSelectors({}),
        new SceneControlsSpacer(),
        editButton,
        // new SceneToolbarButton({
        //   icon: 'edit',
        //   onClick: () => {
        //     const instanceVal = instance.getValue();
        //     const jobVal = job.getValue();
        //     const { checks } = sidebar.useState();
        //     // sidebar.subscribeToState(({ checks }) => {
        //     //   console.log('checks', checks);
        //     // });
        //     console.log('hi', jobVal, instanceVal, checks);
        //   },
        // }),
        new SceneTimePicker({ isOnCanvas: true }),
        new SceneRefreshPicker({
          intervals: ['5s', '1m', '1h'],
          isOnCanvas: true,
        }),
      ],
      body: new SceneFlexLayout({
        direction: 'column',
        children: [
          new SceneFlexLayout({
            direction: 'row',
            height: 150,
            children: [
              new SceneFlexItem({ body: uptime, width: 200 }),
              new SceneFlexItem({ body: reachability, width: 200 }),
              distinctTargets,
              probeDuration,
            ],
          }),
          new SceneFlexLayout({
            direction: 'row',
            minHeight: 300,
            children: [sidebar, body],
          }),
          new SceneFlexLayout({
            direction: 'row',
            minHeight: 300,
            children: [getAssertionTable(logs), getAssertionLogsPanel(logs)],
          }),
        ],
      }),
    });
  };
}
