import {
  behaviors,
  EmbeddedScene,
  SceneControlsSpacer,
  SceneDataLayerControls,
  SceneFlexItem,
  SceneFlexLayout,
  SceneRefreshPicker,
  SceneTimePicker,
  SceneTimeRange,
  SceneVariableSet,
  VariableValueSelectors,
} from '@grafana/scenes';
import { DashboardCursorSync } from '@grafana/schema';

import { Check, CheckType, DashboardSceneAppConfig } from 'types';
import { getReachabilityStat, getUptimeStat, getVariables } from 'scenes/Common';
import { getAlertAnnotations } from 'scenes/Common/alertAnnotations';
import { getAllLogs } from 'scenes/Common/allLogs';
import { getEditButton } from 'scenes/Common/editButton';
import { getEmptyScene } from 'scenes/Common/emptyScene';

import { getResultsByTargetTable } from './ResultsByTargetTable/ResultByTargetTable';
import { getAssertionTable } from './AssertionsTable';
import { getDataTransferred } from './dataTransferred';
import { getDistinctTargets } from './distinctTargets';
import { getProbeDuration } from './probeDuration';

export function getScriptedScene(
  { metrics, logs, singleCheckMode }: DashboardSceneAppConfig,
  checks: Check[] = [],
  checkType: CheckType
) {
  return () => {
    if (checks.length === 0) {
      return getEmptyScene(checkType);
    }
    const timeRange = new SceneTimeRange({
      from: 'now-1h',
      to: 'now',
    });
    const { probe, job, instance } = getVariables(checkType, metrics, checks, singleCheckMode);
    const variables = new SceneVariableSet({
      variables: [probe, job, instance],
    });

    const reachability = getReachabilityStat(metrics);
    const uptime = getUptimeStat(metrics);

    const distinctTargets = getDistinctTargets(metrics);
    const probeDuration = getProbeDuration(metrics);
    const editButton = getEditButton({ job, instance });

    const annotations = getAlertAnnotations(metrics);
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
            children: [getAssertionTable(logs, checkType)],
          }),
          new SceneFlexLayout({
            direction: 'row',
            height: 200,
            children: [distinctTargets, probeDuration],
          }),
          getDataTransferred(metrics),
          new SceneFlexLayout({
            direction: 'row',
            children: [getResultsByTargetTable(metrics, checkType)],
          }),
          new SceneFlexLayout({
            direction: 'row',
            minHeight: 300,
            children: [getAllLogs(logs)],
          }),
        ],
      }),
    });
  };
}
