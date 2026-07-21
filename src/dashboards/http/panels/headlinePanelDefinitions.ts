import { BigValueGraphMode, ThresholdsMode } from '@grafana/schema';
import { DashboardPanelDefinition } from 'dashboards/hooks/useDashboardPanelQuery';
import { getReachabilityQuery } from 'queries/reachability';
import { getUptimeQuery } from 'queries/uptime';

import { DashboardQueryTarget } from 'dashboards/query/types';
import { Check } from 'types';
import {
  DEFAULT_QUERY_FROM_TIME_TEXT,
  LATENCY_DESCRIPTION,
  REACHABILITY_DESCRIPTION,
  UPTIME_DESCRIPTION,
} from 'components/constants';

const uptimeThresholds = {
  mode: ThresholdsMode.Absolute,
  steps: [
    { color: 'red', value: 0 },
    { color: '#EAB839', value: 0.99 },
    { color: 'green', value: 0.995 },
  ],
};

const reachabilityThresholds = {
  mode: ThresholdsMode.Absolute,
  steps: [
    { color: 'red', value: 0 },
    { color: '#EAB839', value: 0.99 },
    { color: 'green', value: 0.995 },
  ],
};

const latencyThresholds = {
  mode: ThresholdsMode.Absolute,
  steps: [
    { color: 'green', value: 0 },
    { color: 'yellow', value: 1 },
    { color: 'red', value: 2 },
  ],
};

const sslThresholds = {
  mode: ThresholdsMode.Absolute,
  steps: [
    { color: '#d44a3a', value: 0 },
    { color: 'rgba(237, 129, 40, 0.89)', value: 604800 },
    { color: '#299c46', value: 2419200 },
  ],
};

export function createUptimePanelDefinition(check: Check): DashboardPanelDefinition {
  const uptimeQuery = getUptimeQuery({
    job: '$job',
    instance: '$instance',
    probe: '$probe',
    frequency: check.frequency,
  });

  const targets: DashboardQueryTarget[] = [
    {
      expr: uptimeQuery.expr,
      hide: false,
      instant: false,
      range: true,
      interval: uptimeQuery.interval,
      legendFormat: '',
      refId: 'B',
    },
  ];

  return {
    id: 'http-uptime',
    pluginId: 'stat',
    maxDataPoints: uptimeQuery.maxDataPoints,
    targets,
    transforms: [{ id: 'reduce', options: { reducers: ['mean'] } }],
    fieldConfig: {
      defaults: {
        unit: 'percentunit',
        decimals: 2,
        thresholds: uptimeThresholds,
        noValue: 'N/A',
      },
      overrides: [],
    },
    options: {
      graphMode: BigValueGraphMode.None,
      reduceOptions: { calcs: ['mean'], fields: '', values: false },
    },
    description: UPTIME_DESCRIPTION,
  };
}

export function createReachabilityPanelDefinition(check: Check): DashboardPanelDefinition {
  const reachabilityQuery = getReachabilityQuery({
    job: '$job',
    instance: '$instance',
    probe: '$probe',
    frequency: check.frequency,
  });

  return {
    id: 'http-reachability',
    pluginId: 'stat',
    targets: [
      {
        expr: reachabilityQuery.expr,
        interval: reachabilityQuery.interval,
        range: true,
        refId: 'reachability',
        legendFormat: 'reachability',
      },
    ],
    transforms: [{ id: 'reduce', options: { labelsToFields: false, reducers: ['mean'] } }],
    fieldConfig: {
      defaults: {
        unit: 'percentunit',
        decimals: 2,
        min: 0,
        max: 1,
        noValue: 'N/A',
        thresholds: reachabilityThresholds,
      },
      overrides: [],
    },
    options: {
      graphMode: BigValueGraphMode.None,
    },
    description: REACHABILITY_DESCRIPTION,
  };
}

export function createAverageLatencyPanelDefinition(): DashboardPanelDefinition {
  return {
    id: 'http-average-latency',
    pluginId: 'stat',
    maxDataPoints: 10,
    targets: [
      {
        expr: 'sum(rate(probe_all_duration_seconds_sum{probe=~"$probe", instance="$instance", job="$job"}[$__rate_interval]))',
        hide: false,
        instant: false,
        legendFormat: 'sum',
        range: true,
        refId: 'A',
      },
      {
        expr: 'sum(rate(probe_all_duration_seconds_count{probe=~"$probe", instance="$instance", job="$job"}[$__rate_interval]))',
        hide: false,
        instant: false,
        legendFormat: 'count',
        range: true,
        refId: 'B',
      },
    ],
    transforms: [
      { id: 'reduce', options: { labelsToFields: false, reducers: ['sum'] } },
      {
        id: 'rowsToFields',
        options: {
          mappings: [{ fieldName: 'Total', handlerKey: 'field.value' }],
        },
      },
      {
        id: 'calculateField',
        options: {
          binary: { left: 'sum', operator: '/', right: 'count' },
          mode: 'binary',
          reduce: { reducer: 'sum' },
        },
      },
      {
        id: 'organize',
        options: {
          excludeByName: { count: true, sum: true },
          includeByName: {},
          indexByName: {},
          renameByName: {},
        },
      },
    ],
    fieldConfig: {
      defaults: {
        unit: 's',
        decimals: 2,
        min: 0,
        max: 1,
        noValue: 'N/A',
        thresholds: latencyThresholds,
      },
      overrides: [],
    },
    options: {
      graphMode: BigValueGraphMode.None,
    },
    description: LATENCY_DESCRIPTION.replace(DEFAULT_QUERY_FROM_TIME_TEXT, DEFAULT_QUERY_FROM_TIME_TEXT),
  };
}

export function createSslExpiryPanelDefinition(): DashboardPanelDefinition {
  return {
    id: 'http-ssl-expiry',
    pluginId: 'stat',
    targets: [
      {
        expr: 'min(probe_ssl_earliest_cert_expiry{probe=~"$probe",instance="$instance", job="$job"}) - time()',
        instant: true,
        legendFormat: 'sum',
        refId: 'B',
      },
    ],
    fieldConfig: {
      defaults: {
        unit: 's',
        decimals: 2,
        min: 0,
        max: 1,
        noValue: 'N/A',
        thresholds: sslThresholds,
      },
      overrides: [],
    },
    options: {
      graphMode: BigValueGraphMode.None,
    },
    description: 'The time remaining until SSL chain expiry',
  };
}

export function createFrequencyPanelDefinition(): DashboardPanelDefinition {
  return {
    id: 'http-frequency',
    pluginId: 'stat',
    maxDataPoints: 10,
    targets: [
      {
        expr: `sum by (frequency) (
          topk(
            1,
            sm_check_info{instance="$instance", job="$job", probe=~"$probe"}
          )
        )`,
        instant: false,
        refId: 'D',
      },
    ],
    transforms: [{ id: 'labelsToFields', options: {} }, { id: 'merge', options: {} }],
    fieldConfig: {
      defaults: {
        unit: 'ms',
        noValue: 'N/A',
        color: { mode: 'fixed', fixedColor: 'green' },
        thresholds: latencyThresholds,
      },
      overrides: [],
    },
    options: {
      graphMode: BigValueGraphMode.None,
      reduceOptions: { values: false, calcs: ['lastNotNull'], fields: '/^frequency$/' },
    },
    description: 'How often is the target checked?',
  };
}
