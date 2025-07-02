import {
  behaviors,
  EmbeddedScene,
  SceneControlsSpacer,
  SceneDataLayerControls,
  SceneFlexLayout,
  SceneRefreshPicker,
  SceneTimePicker,
  SceneVariableSet,
  VariableValueSelectors,
} from '@grafana/scenes';
import { DashboardCursorSync } from '@grafana/schema';

import { Check, CheckType, DashboardSceneAppConfig } from 'types';
import { getVariables } from 'scenes/Common';
import { getAlertAnnotations } from 'scenes/Common/alertAnnotations';
import { getEditButton } from 'scenes/Common/editButton';
import { getTimeRange } from 'scenes/Common/timeRange';

import { getGlobalScoreGaugePanel } from './globalScoreGauge';
import { getGlobalScoreTimeseriesPanel } from './globalScoreTimeseries';
import { getPageInsightsTable } from './pageInsightsTable';
import { getUserJourneysTable } from './userJourneysTable';

export function getAiAgentScene({ metrics }: DashboardSceneAppConfig, check: Check) {
  return () => {
    const timeRange = getTimeRange();
    const { probe, job, instance } = getVariables(CheckType.AiAgent, metrics, check);
    const variables = new SceneVariableSet({
      variables: [probe, job, instance],
    });

    const editButton = getEditButton({ id: check.id });

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
            height: 200,
            children: [getGlobalScoreGaugePanel(), getGlobalScoreTimeseriesPanel()],
          }),
          new SceneFlexLayout({
            direction: 'row',
            height: 500,
            children: [getUserJourneysTable()],
          }),
          new SceneFlexLayout({
            direction: 'row',
            height: 500,
            children: [getPageInsightsTable("Accessibility")],
          }),
          new SceneFlexLayout({
            direction: 'row',
            height: 500,
            children: [getPageInsightsTable("Content")],
          }),
          new SceneFlexLayout({
            direction: 'row',
            height: 500,
            children: [getPageInsightsTable("Reliability")],
          }),
        ],
      }),
    });
  };
}
