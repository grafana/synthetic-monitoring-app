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
  getSSLExpiryStat,
  getUptimeStat,
  getVariables,
} from '../Common';
import { getErrorRateTimeseries } from './errorRateTimeseries';
import { getLatencyByPhasePanel } from './latencyByPhase';
import { getEditButton } from 'scenes/Common/editButton';
import { getEmptyScene } from 'scenes/Common/emptyScene';

export function getHTTPScene({ metrics, logs }: DashboardSceneAppConfig, checks: Check[]) {
  return () => {
    const timeRange = new SceneTimeRange({
      from: 'now-6h',
      to: 'now',
    });
    if (checks.length === 0) {
      return getEmptyScene(CheckType.HTTP);
    }

    const { probe, job, instance } = getVariables(CheckType.HTTP, metrics, checks);
    const variableSet = new SceneVariableSet({ variables: [probe, job, instance] });

    const mapPanel = getErrorRateMapPanel(metrics);
    const uptime = getUptimeStat(metrics);
    const reachability = getReachabilityStat(metrics);
    const avgLatency = getAvgLatencyStat(metrics);
    const sslExpiryStat = getSSLExpiryStat(metrics);
    const frequency = getFrequencyStat(metrics);
    const errorTimeseries = getErrorRateTimeseries(metrics);

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

    return new EmbeddedScene({
      $timeRange: timeRange,
      $variables: variableSet,
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
