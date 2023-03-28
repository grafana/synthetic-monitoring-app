import {
  EmbeddedScene,
  SceneControlsSpacer,
  SceneFlexLayout,
  SceneRefreshPicker,
  SceneTimePicker,
  SceneTimeRange,
  VariableValueSelectors,
} from '@grafana/scenes';
import { getVariables } from 'scenes/Common';
import { CheckType, DashboardSceneAppConfig } from 'types';

export function getDNSScene({ metrics, logs }: DashboardSceneAppConfig) {
  return () => {
    const timeRange = new SceneTimeRange({
      from: 'now-6h',
      to: 'now',
    });

    const variables = getVariables(CheckType.DNS, metrics);

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
        children: [],
      }),
    });
  };
}
