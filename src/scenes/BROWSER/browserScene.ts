import {
  behaviors,
  EmbeddedScene,
  SceneControlsSpacer,
  SceneDataLayerControls,
  SceneFlexItem,
  SceneFlexLayout,
  SceneRefreshPicker,
  SceneTimePicker,
  SceneVariableSet,
  VariableValueSelectors,
} from '@grafana/scenes';
import { DashboardCursorSync } from '@grafana/schema';

import { Check, CheckType, DashboardSceneAppConfig } from 'types';
import { getReachabilityStat, getUptimeStat, getVariables } from 'scenes/Common';
import { getAlertAnnotations } from 'scenes/Common/alertAnnotations';
import { getAllLogs } from 'scenes/Common/allLogs';
import { getAssertionTable } from 'scenes/Common/AssertionsTable';
import { getEditButton } from 'scenes/Common/editButton';
import { getTimeRange } from 'scenes/Common/timeRange';
import { getMinStepFromFrequency } from 'scenes/utils';

import { getCumulativeLayoutShift } from './WebVitals/cumulativeLayoutShift';
import { getInputResponseTime } from './WebVitals/inputResponseTime';
import { getPageLoad } from './WebVitals/pageLoad';
import { getWebVitals } from './WebVitals/webVitals';
import { getWebVitalsTable } from './WebVitals/webVitalsTable';
import { getDataTransferred } from './dataTransferred';
import { getDistinctTargets } from './distinctTargets';
import { getProbeDuration } from './probeDuration';

export function getBrowserScene({ metrics, logs }: DashboardSceneAppConfig, check: Check, checkType: CheckType) {
  return () => {
    const timeRange = getTimeRange();
    const { probe, job, instance } = getVariables(checkType, metrics, check);
    const variables = new SceneVariableSet({
      variables: [probe, job, instance],
    });

    const minStep = getMinStepFromFrequency(check.frequency);

    const reachability = getReachabilityStat(metrics, minStep);
    const uptime = getUptimeStat(metrics, check.frequency);

    const distinctTargets = getDistinctTargets(metrics);
    const probeDuration = getProbeDuration(metrics);
    const editButton = getEditButton({ job, instance });
    const annotations = getAlertAnnotations(metrics);

    const webVitals = getWebVitals(metrics);
    const pageLoad = getPageLoad(metrics);

    const webVitalsTable = getWebVitalsTable(metrics);

    const cumulativeLayoutShift = getCumulativeLayoutShift(metrics);
    const inputResponseTime = getInputResponseTime(metrics);

    return new EmbeddedScene({
      $timeRange: timeRange,
      $variables: variables,
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
            height: 150,
            children: [new SceneFlexItem({ body: uptime }), new SceneFlexItem({ body: reachability })],
          }),
          new SceneFlexLayout({
            direction: 'row',
            height: 150,
            children: [new SceneFlexItem({ body: webVitals })],
          }),
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
          new SceneFlexLayout({
            direction: 'row',
            children: [getAssertionTable(logs, checkType, check.frequency)],
          }),
          new SceneFlexLayout({
            direction: 'row',
            height: 200,
            children: [distinctTargets, probeDuration],
          }),
          getDataTransferred(metrics),
          new SceneFlexLayout({
            direction: 'row',
            minHeight: 900,
            children: [getAllLogs(logs)],
          }),
        ],
      }),
    });
  };
}
