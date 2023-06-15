import { VariableHide } from '@grafana/data';
import {
  CustomVariable,
  EmbeddedScene,
  SceneControlsSpacer,
  SceneFlexLayout,
  SceneRefreshPicker,
  SceneTimePicker,
  SceneTimeRange,
  SceneVariableSet,
  VariableValueSelectors,
} from '@grafana/scenes';
import { DashboardSceneAppConfig, SceneBuilder } from 'types';
import { MultiHttpStepsScene } from './StepPickerScene';
import { getLatencyByPhasePanel } from './latencyByPhase';
import { getProbeDuration } from './probeDuration';
import { getSuccessRatePanel } from './successRate';

export function getMultiHttpScene({ metrics, logs }: DashboardSceneAppConfig): SceneBuilder {
  return () => {
    const timeRange = new SceneTimeRange({
      from: 'now-6h',
      to: 'now',
    });
    const stepIndex = new CustomVariable({ name: 'stepUrl', value: '0', hide: VariableHide.hideVariable });
    const variables = new SceneVariableSet({
      variables: [stepIndex],
    });

    const sidebar = new MultiHttpStepsScene({ checkId: 562 });

    const latencyByPhase = getLatencyByPhasePanel(metrics);

    const body = new EmbeddedScene({
      $variables: variables,
      body: new SceneFlexLayout({
        direction: 'column',
        children: [latencyByPhase],
      }),
    });

    sidebar.subscribeToState(({ stepUrl }) => {
      console.log('state subscribe', { stepUrl });
      stepIndex.changeValueTo(stepUrl ?? '');
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
