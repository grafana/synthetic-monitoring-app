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
import { getAnswerRecordsStat } from './answerRecords';
import { getResourcesRecordsPanel } from './resourceRecords';

export function getDNSScene({ metrics, logs }: DashboardSceneAppConfig) {
  return () => {
    const timeRange = new SceneTimeRange({
      from: 'now-6h',
      to: 'now',
    });

    const variables = new SceneVariableSet({ variables: getVariables(CheckType.DNS, metrics) });
    const errorMap = getErrorRateMapPanel(metrics);

    const uptime = getUptimeStat(metrics);
    const reachability = getReachabilityStat(metrics);
    const avgLatency = getAvgLatencyStat(metrics);
    const answerRecords = getAnswerRecordsStat(metrics);
    const frequency = getFrequencyStat(metrics);

    const statRow = new SceneFlexLayout({
      direction: 'row',
      children: [uptime, reachability, avgLatency, answerRecords, frequency].map((panel) => {
        return new SceneFlexItem({ height: 90, body: panel });
      }),
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

    const latencyByProbe = getLatencyByProbePanel(metrics);
    const resourceRecords = getResourcesRecordsPanel(metrics);

    const latencyRow = new SceneFlexLayout({
      direction: 'row',
      children: [latencyByProbe, resourceRecords].map((panel) => new SceneFlexItem({ body: panel, height: 300 })),
    });

    const logsRow = new SceneFlexLayout({
      direction: 'row',
      children: [new SceneFlexItem({ height: 500, body: getErrorLogs(logs) })],
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
        children: [topRow, latencyRow, logsRow].map((flexItem) => new SceneFlexItem({ body: flexItem })),
      }),
    });
  };
}
