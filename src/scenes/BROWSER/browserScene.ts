import {
  behaviors,
  EmbeddedScene,
  SceneControlsSpacer,
  SceneDataLayerControls,
  SceneFlexItem,
  SceneFlexLayout,
  SceneRefreshPicker,
  SceneTimePicker,
  VariableValueSelectors,
} from '@grafana/scenes';
import { DashboardCursorSync } from '@grafana/schema';

import { Check, CheckType, DashboardSceneAppConfig } from 'types';
import { getAlertAnnotations } from 'scenes/Common/alertAnnotations';
import { getEditButton } from 'scenes/Common/editButton';
import { getTimeRange } from 'scenes/Common/timeRange';

import { getCumulativeLayoutShift } from './WebVitals/cumulativeLayoutShift';
import { getInputResponseTime } from './WebVitals/inputResponseTime';
import { getPageLoad } from './WebVitals/pageLoad';
import { getWebVitalsTable } from './WebVitals/webVitalsTable';

export function getBrowserScene({ metrics, logs }: DashboardSceneAppConfig, check: Check, checkType: CheckType) {
  return () => {
    const timeRange = getTimeRange();

    const editButton = getEditButton({ id: check.id });
    const annotations = getAlertAnnotations(metrics);

    const pageLoad = getPageLoad(metrics);

    const webVitalsTable = getWebVitalsTable(metrics);

    const cumulativeLayoutShift = getCumulativeLayoutShift(metrics);
    const inputResponseTime = getInputResponseTime(metrics);

    return new EmbeddedScene({
      $timeRange: timeRange,
      $behaviors: [new behaviors.CursorSync({ key: 'sync', sync: DashboardCursorSync.Crosshair })],
      $data: annotations,
      controls: [
        new VariableValueSelectors({}),
        new SceneDataLayerControls(),
        new SceneControlsSpacer(),
        editButton,
        new SceneTimePicker({ isOnCanvas: true }),
        new SceneRefreshPicker({
          intervals: ['5s', '1m', '1h'],
          isOnCanvas: true,
          refresh: '1m',
        }),
      ],
      body: new SceneFlexLayout({
        direction: 'column',
        children: [
          new SceneFlexLayout({
            direction: 'row',
            height: 200,
            children: [
              new SceneFlexItem({ body: pageLoad }),
              new SceneFlexItem({ body: cumulativeLayoutShift }),
              new SceneFlexItem({ body: inputResponseTime }),
            ],
          }),
          new SceneFlexLayout({
            direction: 'row',
            height: 300,
            children: [new SceneFlexItem({ body: webVitalsTable })],
          }),
        ],
      }),
    });
  };
}
