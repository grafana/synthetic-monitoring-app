import {
  EmbeddedScene,
  SceneControlsSpacer,
  SceneFlexLayout,
  SceneRefreshPicker,
  SceneTimePicker,
  SceneTimeRange,
  VariableValueSelectors,
} from '@grafana/scenes';
import {
  getAvgLatencyStat,
  getErrorLogs,
  getErrorRateMapPanel,
  getFrequencyStat,
  getLatencyByProbePanel,
  getReachabilityStat,
  getUptimeStat,
  getVariables,
} from 'scenes/Common';
import { getErrorRateTimeseries } from 'scenes/HTTP/errorRateTimeseries';
import { CheckType, DashboardSceneAppConfig } from 'types';
import { getLatencyByPhasePanel } from './latencyByPhase';

export function getPingScene({ metrics, logs }: DashboardSceneAppConfig) {
  return () => {
    const timeRange = new SceneTimeRange({
      from: 'now-6h',
      to: 'now',
    });

    const variables = getVariables(CheckType.PING, metrics);
    const errorMap = getErrorRateMapPanel(metrics);

    const uptime = getUptimeStat(metrics);
    const reachability = getReachabilityStat(metrics);
    const avgLatency = getAvgLatencyStat(metrics);
    const frequency = getFrequencyStat(metrics);

    const statRow = new SceneFlexLayout({
      direction: 'row',
      placement: {
        height: 90,
      },
      children: [uptime, reachability, avgLatency, frequency],
    });

    const errorRateTimeseries = getErrorRateTimeseries(metrics);
    const topRight = new SceneFlexLayout({
      direction: 'column',
      children: [statRow, errorRateTimeseries],
    });

    const topRow = new SceneFlexLayout({
      direction: 'row',
      placement: {
        height: 500,
      },
      children: [errorMap, topRight],
    });

    const latencyByPhase = getLatencyByPhasePanel(metrics);
    const latencyByProbe = getLatencyByProbePanel(metrics);

    const latencyRow = new SceneFlexLayout({
      direction: 'row',
      placement: {
        height: 300,
      },
      children: [latencyByPhase, latencyByProbe],
    });

    const logsRow = new SceneFlexLayout({
      direction: 'row',
      placement: {
        height: 500,
      },
      children: [getErrorLogs(logs)],
    });

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
        children: [topRow, latencyRow, logsRow],
      }),
    });
  };
}
