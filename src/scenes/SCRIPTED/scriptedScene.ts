import {
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

import { Check, CheckType, DashboardSceneAppConfig } from 'types';
import { getReachabilityStat, getUptimeStat, getVariables } from 'scenes/Common';
import { getAllLogs } from 'scenes/Common/allLogs';
import { getEditButton } from 'scenes/Common/editButton';
import { getEmptyScene } from 'scenes/Common/emptyScene';
import { getAssertionLogsPanel } from 'scenes/MULTIHTTP/assertionLogs';
import { getAssertionTable } from 'scenes/MULTIHTTP/assertionTable';
import { getDistinctTargets } from 'scenes/MULTIHTTP/distinctTargets';
import { getProbeDuration } from 'scenes/MULTIHTTP/probeDuration';

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
            children: [new SceneFlexItem({ body: uptime }), new SceneFlexItem({ body: reachability }), distinctTargets],
          }),
          new SceneFlexLayout({
            direction: 'row',
            height: 200,
            children: [probeDuration],
          }),
          new SceneFlexLayout({
            direction: 'row',
            minHeight: 300,
            children: [getAssertionTable(logs), getAssertionLogsPanel(logs)],
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
