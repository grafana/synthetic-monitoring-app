import {
  behaviors,
  EmbeddedScene,
  SceneControlsSpacer,
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
import { getAllLogs } from 'scenes/Common/allLogs';
import { getEditButton } from 'scenes/Common/editButton';
import { getEmptyScene } from 'scenes/Common/emptyScene';
import { getDistinctTargets } from 'scenes/MULTIHTTP/distinctTargets';
import { getProbeDuration } from 'scenes/MULTIHTTP/probeDuration';

import { getResultsByTargetTable } from './ResultsByTargetTable/ResultByTargetTable';
import { getAssertionTable } from './AssertionsTable';
import { getDataTransferred } from './dataTransferred';

export function getScriptedScene({ metrics, logs }: DashboardSceneAppConfig, checks: Check[] = []) {
  return () => {
    if (checks.length === 0) {
      return getEmptyScene(CheckType.K6);
    }
    const timeRange = new SceneTimeRange({
      from: 'now-6h',
      to: 'now',
    });
    const { probe, job, instance } = getVariables(CheckType.K6, metrics, checks);
    const variables = new SceneVariableSet({
      variables: [probe, job, instance],
    });

    const reachability = getReachabilityStat(metrics);
    const uptime = getUptimeStat(metrics);

    const distinctTargets = getDistinctTargets(metrics);
    const probeDuration = getProbeDuration(metrics);
    const editButton = getEditButton({ job, instance });
    return new EmbeddedScene({
      $timeRange: timeRange,
      $variables: variables,
      $behaviors: [new behaviors.CursorSync({ key: 'sync', sync: DashboardCursorSync.Crosshair })],
      controls: [
        new VariableValueSelectors({}),
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
            children: [getAssertionTable(logs)],
          }),
          new SceneFlexLayout({
            direction: 'row',
            height: 200,
            children: [distinctTargets, probeDuration],
          }),
          getDataTransferred(metrics),
          new SceneFlexLayout({
            direction: 'row',
            children: [getResultsByTargetTable(metrics)],
          }),
          // new SceneFlexLayout({
          //   direction: 'row',
          //   height: 400,
          //   children: [getExpectedResponse(metrics)],
          // }),
          // new SceneFlexLayout({
          //   direction: 'row',
          //   height: 200,
          //   children: [getSuccessRateByUrl(metrics)],
          // }),
          // new SceneFlexLayout({
          //   direction: 'row',
          //   minHeight: 300,
          //   children: [getAssertionLogsPanel(logs)],
          // }),
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
