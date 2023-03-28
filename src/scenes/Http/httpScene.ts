import {
  EmbeddedScene,
  QueryVariable,
  SceneControlsSpacer,
  SceneFlexLayout,
  SceneRefreshPicker,
  SceneTimePicker,
  SceneTimeRange,
  SceneVariableSet,
  VariableValueSelectors,
} from '@grafana/scenes';
import { DashboardSceneAppConfig } from 'types';
import { getAvgLatencyStat } from './avgLatencyStat';
import { getErrorLogs } from './errorLogs';
import { getHttpErrorRateMapPanel } from './errorRateMap';
import { getErrorRateTimeseries } from './errorRateTimeseries';
import { getFrequencyStat } from './frequencyStat';
import { getLatencyByPhasePanel } from './latencyByPhase';
import { getLatencyByProbePanel } from './latencyByProbe';
import { getReachabilityStat } from './reachabilityStat';
import { getSSLExpiryStat } from './sslExpiryStat';
import { getUptimeStat } from './uptimeStat';

export function getHTTPScene({ metrics, logs }: DashboardSceneAppConfig) {
  return () => {
    const timeRange = new SceneTimeRange({
      from: 'now-6h',
      to: 'now',
    });

    // Variable definition
    const probe = new QueryVariable({
      includeAll: true,
      allValue: '.*',
      name: 'probe',
      query: { query: 'label_values(sm_check_info{check_name="http"},probe)' },
      datasource: metrics,
    });

    const job = new QueryVariable({
      name: 'job',
      $variables: new SceneVariableSet({ variables: [probe] }),
      query: { query: 'label_values(sm_check_info{check_name="http", probe=~"$probe"},job)' },
      datasource: metrics,
    });

    const instance = new QueryVariable({
      name: 'instance',
      $variables: new SceneVariableSet({ variables: [probe, job] }),
      query: { query: 'label_values(sm_check_info{check_name="http", job="$job", probe=~"$probe"},instance)' },
      datasource: metrics,
    });

    const variableSet = new SceneVariableSet({ variables: [probe, job, instance] });

    const mapPanel = getHttpErrorRateMapPanel(variableSet, metrics);
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
