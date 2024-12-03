import {
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

import { Check, CheckType, DashboardSceneAppConfig } from 'types';
import { getAlertAnnotations } from 'scenes/Common/alertAnnotations';
import { getEditButton } from 'scenes/Common/editButton';
import { getEmptyScene } from 'scenes/Common/emptyScene';
import { getMinStepFromFrequency } from 'scenes/utils';

import {
  getAvgLatencyStat,
  getErrorLogs,
  getErrorRateMapPanel,
  getFrequencyStat,
  getLatencyByProbePanel,
  getReachabilityStat,
  getSSLExpiryStat,
  getUptimeStat,
  getVariables,
} from '../Common';
import { getErrorRateTimeseries } from './errorRateTimeseries';
import { getLatencyByPhasePanel } from './latencyByPhase';
import { getInsightsPanel } from '../Insights';

export function getHTTPScene({ metrics, logs, singleCheckMode }: DashboardSceneAppConfig, checks: Check[], newUptimeQuery = false) {
  return () => {
    const timeRange = new SceneTimeRange({
      from: 'now-1h',
      to: 'now',
    });
    if (checks.length === 0) {
      return getEmptyScene(CheckType.HTTP);
    }

    const minStep = getMinStepFromFrequency(checks?.[0]?.frequency);

    const { probe, job, instance } = getVariables(CheckType.HTTP, metrics, checks, singleCheckMode);
    const variableSet = new SceneVariableSet({ variables: [probe, job, instance] });

    const insightsPanel = getInsightsPanel(metrics);
    const mapPanel = getErrorRateMapPanel(metrics, minStep);
    const uptime = getUptimeStat(metrics, minStep, newUptimeQuery);
    const reachability = getReachabilityStat(metrics, minStep);
    const avgLatency = getAvgLatencyStat(metrics, minStep);
    const sslExpiryStat = getSSLExpiryStat(metrics);
    const frequency = getFrequencyStat(metrics);
    const errorTimeseries = getErrorRateTimeseries(metrics, minStep);

    const statRow = new SceneFlexLayout({
      direction: 'row',
      children: [uptime, reachability, avgLatency, sslExpiryStat, frequency].map((panel) => {
        return new SceneFlexItem({ height: 90, body: panel });
      }),
    });

    const statColumn = new SceneFlexLayout({
      direction: 'column',
      children: [new SceneFlexItem({ height: 90, body: statRow }), new SceneFlexItem({ body: errorTimeseries })],
    });

    const insightsRow = new SceneFlexLayout({
        direction: 'row',
        children: [
          new SceneFlexItem({ body: insightsPanel }),
      ],
    });

    const topRow = new SceneFlexLayout({
      direction: 'row',
      children: [
        new SceneFlexItem({ height: 500, width: 500, body: mapPanel }),
        new SceneFlexItem({ body: statColumn }),
      ],
    });

    const latencyByPhase = getLatencyByPhasePanel(metrics);
    const latencyByProbe = getLatencyByProbePanel(metrics);

    const latencyRow = new SceneFlexLayout({
      direction: 'row',
      children: [latencyByPhase, latencyByProbe].map((panel) => new SceneFlexItem({ body: panel, height: 300 })),
    });

    const errorLogs = getErrorLogs(logs);

    const logsRow = new SceneFlexLayout({
      direction: 'row',
      children: [new SceneFlexItem({ height: 500, body: errorLogs })],
    });

    const editButton = getEditButton({ job, instance });

    const annotations = getAlertAnnotations(metrics);

    return new EmbeddedScene({
      $timeRange: timeRange,
      $variables: variableSet,
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
        children: [insightsRow, topRow, latencyRow, logsRow].map((flexItem) => new SceneFlexItem({ body: flexItem })),
      }),
    });
  };
}
