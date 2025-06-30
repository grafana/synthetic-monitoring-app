import {
  ListTenantLimitsResponse,
  ListTenantSettingsResult,
  TenantResponse,
  UpdateTenantSettingsResult,
} from 'datasource/responses.types';

export const TENANT: TenantResponse = {
  id: 76,
  orgId: 442,
  metricsRemote: {
    name: 'ckbedwellksix-prom',
    url: 'https://prometheus-dev-01-dev-us-central-0.grafana-dev.net/api/prom',
    username: '15629',
    password: '<redacted>',
  },
  eventsRemote: {
    name: 'ckbedwellksix-logs',
    url: 'https://logs-dev-005.grafana-dev.net/loki/api/v1',
    username: '147960',
    password: '<redacted>',
  },
  stackId: 2484,
  status: 0,
  reason: 'publisher token is invalid',
  limits: null,
  created: 1696236854.858741,
  modified: 1707388228.64038,
};

export const TENANT_SETTINGS: ListTenantSettingsResult = {
  remote_validation_disabled: false,
  thresholds: {
    latency: {
      upperLimit: 200,
      lowerLimit: 150,
    },
    reachability: {
      upperLimit: 99.3,
      lowerLimit: 94.6,
    },
    uptime: {
      upperLimit: 99.3,
      lowerLimit: 94.6,
    },
    score: {
      upperLimit: 80,
      lowerLimit: 60,
    },
    duration: {
      upperLimit: 30000,
      lowerLimit: 15000,
    },
  },
};

export const UPDATE_TENANT_SETTINGS: UpdateTenantSettingsResult = { msg: 'Settings updated' };
export const TENANT_LIMITS: ListTenantLimitsResponse = {
  MaxBrowserChecks: 10,
  MaxChecks: 100,
  MaxScriptedChecks: 10,
  MaxMetricLabels: 20,
  MaxLogLabels: 15,
  maxAllowedMetricLabels: 10,
  maxAllowedLogLabels: 5,
};
