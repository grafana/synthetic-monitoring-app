import {
  EmbeddedScene,
  SceneControlsSpacer,
  SceneFlexItem,
  SceneFlexLayout,
  SceneRefreshPicker,
  SceneTimePicker,
  SceneTimeRange,
  VariableValueSelectors,
} from '@grafana/scenes';
import { getVariables } from 'scenes/Common';
import { CheckType, DashboardSceneAppConfig } from 'types';
import { getAverageHopsPanel } from './averageHops';
import { getCommonHostsPanel } from './commonHosts';
import { getLogsPanel } from './logs';
import { getNodeGraphPanel } from './nodeGraph';
import { getPacketLossPanel } from './packetLoss';
import { getRouteHashPanel } from './routeHash';
import { getTraceTimePanel } from './traceTime';

export function getTracerouteScene({ metrics, logs, sm }: DashboardSceneAppConfig) {
  return () => {
    const timeRange = new SceneTimeRange({
      from: 'now-30m',
      to: 'now',
    });
    const variables = getVariables(CheckType.Traceroute, metrics);

    const nodeGraph = getNodeGraphPanel(sm);

    const routeHash = getRouteHashPanel(metrics);
    const commonHosts = getCommonHostsPanel(logs);

    const hosts = new SceneFlexLayout({
      direction: 'row',
      children: [routeHash, commonHosts].map((panel) => new SceneFlexItem({ body: panel })),
    });

    const packetLoss = getPacketLossPanel(metrics);
    const traceTime = getTraceTimePanel(metrics);
    const avgHops = getAverageHopsPanel(metrics);
    const overall = new SceneFlexLayout({
      direction: 'row',
      children: [packetLoss, traceTime, avgHops].map((panel) => new SceneFlexItem({ body: panel })),
    });

    const logsPanel = getLogsPanel(logs);

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
        children: [nodeGraph, hosts, overall, logsPanel].map((panel) => new SceneFlexItem({ body: panel })),
      }),
    });
  };
}
