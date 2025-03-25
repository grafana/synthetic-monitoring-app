import {
  EmbeddedScene,
  SceneControlsSpacer,
  SceneDataLayerControls,
  SceneFlexItem,
  SceneFlexLayout,
  SceneRefreshPicker,
  SceneTimePicker,
  SceneVariableSet,
  VariableValueSelectors,
} from '@grafana/scenes';

import { Check, CheckType, DashboardSceneAppConfig } from 'types';
import { getVariables } from 'scenes/Common';
import { getAlertAnnotations } from 'scenes/Common/alertAnnotations';
import { getEditButton } from 'scenes/Common/editButton';
import { getTimeRange } from 'scenes/Common/timeRange';

import { getAverageHopsPanel } from './averageHops';
import { getCommonHostsPanel } from './commonHosts';
import { getLogsPanel } from './logs';
import { getNodeGraphPanel } from './nodeGraph';
import { getPacketLossPanel } from './packetLoss';
import { getRouteHashPanel } from './routeHash';
import { getTraceTimePanel } from './traceTime';

export function getTracerouteScene({ metrics, logs, sm }: DashboardSceneAppConfig, check: Check) {
  return () => {
    const timeRange = getTimeRange();
    const { probe, job, instance } = getVariables(CheckType.Traceroute, metrics, check);
    const variables = new SceneVariableSet({ variables: [probe, job, instance] });

    const nodeGraph = new SceneFlexItem({ height: 500, body: getNodeGraphPanel(sm) });

    const routeHash = getRouteHashPanel(metrics);
    const commonHosts = getCommonHostsPanel(logs);

    const hosts = new SceneFlexLayout({
      direction: 'row',
      children: [routeHash, commonHosts].map((panel) => new SceneFlexItem({ body: panel })),
    });

    const hostsRow = new SceneFlexItem({ height: 300, body: hosts });

    const packetLoss = getPacketLossPanel(metrics);
    const traceTime = getTraceTimePanel(metrics);
    const avgHops = getAverageHopsPanel(metrics);
    const overall = new SceneFlexLayout({
      direction: 'row',
      children: [packetLoss, traceTime, avgHops].map((panel) => new SceneFlexItem({ body: panel })),
    });
    const overallRow = new SceneFlexItem({ height: 300, body: overall });

    const logsPanel = getLogsPanel(logs);
    const logsRow = new SceneFlexItem({ height: 400, body: logsPanel });

    const editButton = getEditButton({ id: check.id });

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
          refresh: '1m',
        }),
      ],
      body: new SceneFlexLayout({
        direction: 'column',
        children: [nodeGraph, hostsRow, overallRow, logsRow],
      }),
    });
  };
}
