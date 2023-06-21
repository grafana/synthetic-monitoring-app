import { VariableHide } from '@grafana/data';
import {
  CustomVariable,
  EmbeddedScene,
  SceneControlsSpacer,
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
import { getSuccessRatePanel } from './successRate';
import { getVariables } from 'scenes/Common';

export function getMultiHttpScene({ metrics, logs }: DashboardSceneAppConfig): SceneBuilder {
  return () => {
    const timeRange = new SceneTimeRange({
      from: 'now-6h',
      to: 'now',
    });
    const basicVariables = getVariables(CheckType.MULTI_HTTP, metrics);
    const stepUrl = new CustomVariable({ name: 'stepUrl', value: '', hide: VariableHide.hideVariable });
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

    const body = new EmbeddedScene({
      body: new SceneFlexLayout({
        direction: 'column',
        children: [latencyByPhase],
      }),
    });

    sidebar.subscribeToState(({ stepUrl: value }) => {
      if (value !== stepUrl.getValue()) {
        stepUrl.changeValueTo(value ?? '');
      }
    });

    const successRate = getSuccessRatePanel(metrics);
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
            children: [successRate, probeDuration],
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
