import { DashboardPanelDefinition } from 'dashboards/hooks/useDashboardPanelQuery';
import { getReachabilityQuery } from 'queries/reachability';
import { getUptimeQuery } from 'queries/uptime';

import { Check } from 'types';

const baseDefinition = {
  pluginId: 'timeseries',
  fieldConfig: { defaults: {}, overrides: [] },
  options: {},
};

const selector = 'probe=~"$probe", instance="$instance", job="$job"';

export function createUptimeSparklineDefinition(check: Check): DashboardPanelDefinition {
  const uptimeQuery = getUptimeQuery({
    job: '$job',
    instance: '$instance',
    probe: '$probe',
    frequency: check.frequency,
  });

  return {
    ...baseDefinition,
    id: 'http-uptime-sparkline',
    maxDataPoints: 200,
    targets: [
      {
        expr: uptimeQuery.expr,
        hide: false,
        instant: false,
        range: true,
        interval: uptimeQuery.interval,
        legendFormat: 'uptime',
        refId: 'uptime',
      },
    ],
  };
}

export function createReachabilitySparklineDefinition(check: Check): DashboardPanelDefinition {
  const reachabilityQuery = getReachabilityQuery({
    job: '$job',
    instance: '$instance',
    probe: '$probe',
    frequency: check.frequency,
  });

  return {
    ...baseDefinition,
    id: 'http-reachability-sparkline',
    maxDataPoints: 200,
    targets: [
      {
        expr: reachabilityQuery.expr,
        interval: reachabilityQuery.interval,
        range: true,
        instant: false,
        refId: 'reachability',
        legendFormat: 'reachability',
      },
    ],
  };
}

export function createAverageLatencySparklineDefinition(check: Check): DashboardPanelDefinition {
  const interval = `${check.frequency / 1000}s`;

  return {
    ...baseDefinition,
    id: 'http-average-latency-sparkline',
    maxDataPoints: 200,
    targets: [
      {
        expr: `(sum(rate(probe_all_duration_seconds_sum{${selector}}[$__rate_interval])) / sum(rate(probe_all_duration_seconds_count{${selector}}[$__rate_interval])))`,
        hide: false,
        instant: false,
        interval,
        range: true,
        legendFormat: 'latency',
        refId: 'latency',
      },
    ],
  };
}
