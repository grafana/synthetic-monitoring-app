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

import { Check, CheckType, DashboardSceneAppConfig } from '../../types';

import {
  getAvgLatencyStat,
  getErrorLogs,
  getErrorRateMapPanel,
  getFrequencyStat,
  getLatencyByProbePanel,
  getReachabilityStat,
  getUptimeStat,
  getVariables,
} from '../Common';
import { getAlertAnnotations } from '../Common/alertAnnotations';
import { getEditButton } from '../Common/editButton';
import { getErrorRateTimeseries } from '../HTTP/errorRateTimeseries';
import { getMinStepFromFrequency } from '../utils';

// This is a placeholder scene for GRPC checks (basically a copy of the TCP scene)
// TODO: Implement the actual GRPC scene
export function getGRPCScene({ metrics, logs }: DashboardSceneAppConfig, check: Check) {
  return () => {
    const timeRange = new SceneTimeRange({
      from: 'now-6h',
      to: 'now',
    });

    const { job, instance, probe } = getVariables(CheckType.GRPC, metrics, check);
    const variables = new SceneVariableSet({ variables: [probe, job, instance] });
    const minStep = getMinStepFromFrequency(check.frequency);
    const errorMap = getErrorRateMapPanel(metrics, minStep);
    const uptime = getUptimeStat(metrics, check.frequency);
    const reachability = getReachabilityStat(metrics, minStep);
    const avgLatency = getAvgLatencyStat(metrics, minStep);
    const frequency = getFrequencyStat(metrics);

    const statRow = new SceneFlexLayout({
      direction: 'row',
      children: [uptime, reachability, avgLatency, frequency].map((panel) => {
        return new SceneFlexItem({ height: 90, body: panel });
      }),
    });

    const errorRateTimeseries = getErrorRateTimeseries(metrics, minStep);
    const topRight = new SceneFlexLayout({
      direction: 'column',
      children: [new SceneFlexItem({ height: 90, body: statRow }), new SceneFlexItem({ body: errorRateTimeseries })],
    });

    const topRow = new SceneFlexLayout({
      direction: 'row',
      children: [new SceneFlexItem({ height: 500, width: 500, body: errorMap }), new SceneFlexItem({ body: topRight })],
    });

    const latencyByProbe = getLatencyByProbePanel(metrics);

    const latencyRow = new SceneFlexLayout({
      direction: 'row',
      children: [new SceneFlexItem({ body: latencyByProbe, height: 300 })],
    });

    const logsRow = new SceneFlexLayout({
      direction: 'row',
      children: [new SceneFlexItem({ height: 500, body: getErrorLogs(logs) })],
    });

    const editButton = getEditButton({ job, instance });

    const annotations = getAlertAnnotations(metrics);
    return new EmbeddedScene({
      $timeRange: timeRange,
      $variables: variables,
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
        }),
      ],
      body: new SceneFlexLayout({
        direction: 'column',
        children: [topRow, latencyRow, logsRow].map((panel) => new SceneFlexItem({ body: panel })),
      }),
    });
  };
}
