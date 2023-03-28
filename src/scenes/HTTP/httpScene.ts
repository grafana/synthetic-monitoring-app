import {
  EmbeddedScene,
  SceneControlsSpacer,
  SceneFlexLayout,
  SceneRefreshPicker,
  SceneTimePicker,
  SceneTimeRange,
  VariableValueSelectors,
} from '@grafana/scenes';
import { CheckType, DashboardSceneAppConfig } from 'types';
import {
  getAvgLatencyStat,
  getErrorLogs,
  getUptimeStat,
  getReachabilityStat,
  getFrequencyStat,
  getLatencyByProbePanel,
  getErrorRateMapPanel,
  getVariables,
} from '../Common';
import { getErrorRateTimeseries } from './errorRateTimeseries';
import { getLatencyByPhasePanel } from './latencyByPhase';
import { getSSLExpiryStat } from './sslExpiryStat';

export function getHTTPScene({ metrics, logs }: DashboardSceneAppConfig) {
  return () => {
    const timeRange = new SceneTimeRange({
      from: 'now-6h',
      to: 'now',
    });

    const variableSet = getVariables(CheckType.HTTP, metrics);

    const mapPanel = getErrorRateMapPanel(variableSet, metrics);
    const uptime = getUptimeStat(variableSet, metrics);
    const reachability = getReachabilityStat(variableSet, metrics);
    const avgLatency = getAvgLatencyStat(variableSet, metrics);
    const sslExpiryStat = getSSLExpiryStat(variableSet, metrics);
    const frequency = getFrequencyStat(variableSet, metrics);
    const errorTimeseries = getErrorRateTimeseries(variableSet, metrics);

    const statRow = new SceneFlexLayout({
      direction: 'row',
      placement: {
        height: 90,
      },
      children: [uptime, reachability, avgLatency, sslExpiryStat, frequency],
    });

    const statColumn = new SceneFlexLayout({
      direction: 'column',
      children: [statRow, errorTimeseries],
    });

    const topRow = new SceneFlexLayout({
      direction: 'row',
      children: [mapPanel, statColumn],
    });

    const latencyByPhase = getLatencyByPhasePanel(variableSet, metrics);
    // TODO: This is rendering as a stacked bar chart instead of points
    const latencyByProbe = getLatencyByProbePanel(variableSet, metrics);

    const latencyRow = new SceneFlexLayout({
      direction: 'row',
      children: [latencyByPhase, latencyByProbe],
    });

    const errorLogs = getErrorLogs(variableSet, logs);

    const logsRow = new SceneFlexLayout({
      direction: 'row',
      children: [errorLogs],
    });

    return new EmbeddedScene({
      $timeRange: timeRange,
      $variables: variableSet,
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
        children: [topRow, latencyRow, logsRow],
      }),
    });
  };
}
