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
import { getEditButton } from 'scenes/Common/editButton';
import { getEmptyScene } from 'scenes/Common/emptyScene';
import { getErrorRateTimeseries } from 'scenes/HTTP/errorRateTimeseries';

import { getLatencyByPhasePanel } from './latencyByPhase';

export function getPingScene({ metrics, logs }: DashboardSceneAppConfig, checks: Check[]) {
  return () => {
    if (checks.length === 0) {
      return getEmptyScene(CheckType.PING);
    }

    const timeRange = new SceneTimeRange({
      from: 'now-6h',
      to: 'now',
    });

    const { job, instance, probe } = getVariables(CheckType.PING, metrics, checks);

    const variables = new SceneVariableSet({ variables: [probe, job, instance] });
    const errorMap = getErrorRateMapPanel(metrics);

    const uptime = getUptimeStat(metrics);
    const reachability = getReachabilityStat(metrics);
    const avgLatency = getAvgLatencyStat(metrics);
    const frequency = getFrequencyStat(metrics);

    const statRow = new SceneFlexLayout({
      direction: 'row',
      children: [uptime, reachability, avgLatency, frequency].map(
        (panel) => new SceneFlexItem({ body: panel, height: 90 })
      ),
    });

    const errorRateTimeseries = getErrorRateTimeseries(metrics);
    const topRight = new SceneFlexLayout({
      direction: 'column',
      children: [new SceneFlexItem({ height: 90, body: statRow }), new SceneFlexItem({ body: errorRateTimeseries })],
    });

    const topRow = new SceneFlexLayout({
      direction: 'row',

      children: [new SceneFlexItem({ height: 500, width: 500, body: errorMap }), new SceneFlexItem({ body: topRight })],
    });

    const latencyByPhase = getLatencyByPhasePanel(metrics);
    const latencyByProbe = getLatencyByProbePanel(metrics);

    const latencyRow = new SceneFlexLayout({
      direction: 'row',
      children: [latencyByPhase, latencyByProbe].map((panel) => new SceneFlexItem({ body: panel, height: 300 })),
    });

    const logsRow = new SceneFlexLayout({
      direction: 'row',
      children: [new SceneFlexItem({ height: 500, body: getErrorLogs(logs) })],
    });

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
        children: [topRow, latencyRow, logsRow].map((flexItem) => new SceneFlexItem({ body: flexItem })),
      }),
    });
  };
}
