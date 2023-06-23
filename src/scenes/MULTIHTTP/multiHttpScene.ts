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
import { CheckType, DashboardSceneAppConfig, SceneBuilder } from 'types';
import { MultiHttpStepsScene } from './StepPickerScene';
import { getLatencyByPhasePanel } from './latencyByPhase';
import { getProbeDuration } from './probeDuration';
import { getReachabilityStat, getUptimeStat, getVariables } from 'scenes/Common';
import { getDistinctTargets } from './distinctTargets';
import { getLatencyByUrlPanel } from './latencyByUrl';

export function getMultiHttpScene({ metrics, logs }: DashboardSceneAppConfig): SceneBuilder {
  return () => {
    const timeRange = new SceneTimeRange({
      from: 'now-6h',
      to: 'now',
    });
    const basicVariables = getVariables(CheckType.MULTI_HTTP, metrics);
    const stepUrl = new CustomVariable({
      name: 'stepUrl',
      hide: VariableHide.hideVariable,
    });
    const variables = new SceneVariableSet({
      variables: [...basicVariables, stepUrl],
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
    const sidebar = new MultiHttpStepsScene({ job: '', target: '', $data: resultsByUrl });

    const latencyByPhase = getLatencyByPhasePanel(metrics);
    const latencyByUrl = getLatencyByUrlPanel(metrics);

    const body = new EmbeddedScene({
      body: new SceneFlexLayout({
        direction: 'row',
        children: [latencyByUrl, latencyByPhase],
      }),
    });

    sidebar.subscribeToState(({ stepUrl: value }) => {
      if (value !== stepUrl.getValue()) {
        stepUrl.changeValueTo(value ?? '');
      }
    });

    // const successRate = getUptimePanel(metrics);
    const reachability = getReachabilityStat(metrics);
    const uptime = getUptimeStat(metrics);
    const distinctTargets = getDistinctTargets(metrics);
    const probeDuration = getProbeDuration(metrics);

    return new EmbeddedScene({
      $timeRange: timeRange,
      $variables: variables,
      controls: [
        new VariableValueSelectors({}),
        new SceneControlsSpacer(),
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
            children: [sidebar, body],
          }),
        ],
      }),
    });
  };
}
