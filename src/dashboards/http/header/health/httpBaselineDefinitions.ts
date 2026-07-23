import { DashboardPanelDefinition } from 'dashboards/hooks/useDashboardPanelQuery';
import { getUptimeQuery } from 'queries/uptime';

import { HTTPCheck } from 'types';

const SELECTOR = 'probe=~"$probe", instance="$instance", job="$job"';

const BASE_DEFINITION = {
  pluginId: 'timeseries',
  fieldConfig: { defaults: {}, overrides: [] },
  options: {},
  maxDataPoints: 720,
};

export function createUptimeBaselineDefinition(check: HTTPCheck): DashboardPanelDefinition {
  const query = getUptimeQuery({
    job: '$job',
    instance: '$instance',
    probe: '$probe',
    frequency: check.frequency,
  });

  return {
    ...BASE_DEFINITION,
    id: 'http-health-uptime-baseline',
    targets: [
      {
        refId: 'uptime',
        expr: query.expr,
        interval: '1h',
        range: true,
      },
    ],
  };
}

export function createReachabilityBaselineDefinition(): DashboardPanelDefinition {
  return {
    ...BASE_DEFINITION,
    id: 'http-health-reachability-baseline',
    targets: [
      {
        refId: 'reachability',
        expr: `sum(increase(probe_all_success_sum{${SELECTOR}}[1h])) / sum(increase(probe_all_success_count{${SELECTOR}}[1h]))`,
        interval: '1h',
        range: true,
      },
    ],
  };
}

export function createLatencyBaselineDefinition(): DashboardPanelDefinition {
  return {
    ...BASE_DEFINITION,
    id: 'http-health-latency-baseline',
    targets: [
      {
        refId: 'latency',
        expr: `sum(rate(probe_all_duration_seconds_sum{${SELECTOR}}[1h])) / sum(rate(probe_all_duration_seconds_count{${SELECTOR}}[1h]))`,
        interval: '1h',
        range: true,
      },
    ],
  };
}
