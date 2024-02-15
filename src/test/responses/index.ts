import { BASIC_CHECK_LIST, BASIC_HTTP_CHECK, CheckInfo } from 'test/fixtures/checks';
import { DEFAULT_PROBES, PRIVATE_PROBE, PUBLIC_PROBE } from 'test/fixtures/probes';

import {
  AddCheckResult,
  AddProbeResult,
  AdHocCheckResponse,
  BulkUpdateCheckResult,
  CheckInfoResult,
  DeleteCheckResult,
  DeleteProbeResult,
  ListCheckResult,
  ListProbeResult,
  ListTenantSettingsResult,
  MetricDatasourceResponse,
  MetricProbeSuccessRate,
  ResetProbeTokenResult,
  TenantResponse,
  UpdateCheckResult,
  UpdateProbeResult,
  UpdateTenantSettingsResult,
} from 'datasource/responses.types';

export const listProbesResult: ListProbeResult = DEFAULT_PROBES;
export const addProbeResult: AddProbeResult = { probe: PRIVATE_PROBE, token: 'a token' };
export const updateProbeResult: UpdateProbeResult = { probe: PRIVATE_PROBE };
export const updateProbeTokenResult: ResetProbeTokenResult = { probe: PRIVATE_PROBE, token: 'a token' };
export const deleteProbeResult: DeleteProbeResult = { msg: 'Probe deleted', probeId: PRIVATE_PROBE.id };

export const listChecksResult: ListCheckResult = BASIC_CHECK_LIST;
export const addCheckResult: AddCheckResult = BASIC_HTTP_CHECK;
export const updateCheckResult: UpdateCheckResult = BASIC_HTTP_CHECK;
export const deleteCheckResult: DeleteCheckResult = { msg: 'Check deleted', checkId: BASIC_HTTP_CHECK.id };

export const checkInfoResult: CheckInfoResult = CheckInfo;

export const bulkUpdateCheckResult: BulkUpdateCheckResult = { msg: 'Checks updated' };
export const adHocCheckResult: AdHocCheckResponse = {
  id: '123',
  tenantId: 1,
  timeout: 1,
  settings: {},
  probes: [1],
  target: 'target',
};

export const listTenantSettingsResult: ListTenantSettingsResult = {
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
  },
};

export const tenatResult: TenantResponse = {
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

export const updateTenantSettingsResult: UpdateTenantSettingsResult = { msg: 'Settings updated' };

export const probeMetricsResult: MetricDatasourceResponse<MetricProbeSuccessRate> = {
  status: `success`,
  data: {
    resultType: `vector`,
    result: [
      {
        metric: {
          probe: PUBLIC_PROBE.name,
        },
        value: [1707826088, '0.9764895437152924'],
      },
      {
        metric: {
          probe: PRIVATE_PROBE.name,
        },
        value: [1598535155, '1'],
      },
    ],
  },
};
