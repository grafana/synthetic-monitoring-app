import { config } from '@grafana/runtime';
import { BASIC_CHECK_ALERTS } from 'test/fixtures/checkAlerts';
import { BASIC_HTTP_CHECK } from 'test/fixtures/checks';
import { LOGS_DATASOURCE, METRICS_DATASOURCE, SM_DATASOURCE } from 'test/fixtures/datasources';
import { PRIVATE_PROBE } from 'test/fixtures/probes';
import { apiRoute, ApiRoutes, getServerRequests } from 'test/handlers';
import { server } from 'test/server';

import { AlertSensitivity } from 'types';
import { SMDataSource } from 'datasource/DataSource';

type Entry = {
  method: keyof SMDataSource;
  payload: unknown | unknown[];
  handler: keyof ApiRoutes;
};

const entries: Entry[] = [
  {
    method: `listProbes`,
    payload: undefined,
    handler: 'listProbes',
  },
  {
    method: 'addProbe',
    payload: PRIVATE_PROBE,
    handler: 'addProbe',
  },
  {
    method: 'updateProbe',
    payload: PRIVATE_PROBE,
    handler: 'updateProbe',
  },
  {
    method: 'resetProbeToken',
    payload: PRIVATE_PROBE,
    handler: 'updateProbe',
  },
  {
    method: 'deleteProbe',
    payload: 1,
    handler: 'deleteProbe',
  },
  {
    method: 'getCheckInfo',
    payload: undefined,
    handler: 'checkInfo',
  },
  {
    method: 'listChecks',
    payload: undefined,
    handler: 'listChecks',
  },
  {
    method: 'testCheck',
    payload: BASIC_HTTP_CHECK,
    handler: 'testCheck',
  },
  {
    method: 'addCheck',
    payload: { check: BASIC_HTTP_CHECK },
    handler: 'addCheck',
  },
  {
    method: 'deleteCheck',
    payload: 1,
    handler: 'deleteCheck',
  },
  {
    method: 'updateCheck',
    payload: { check: BASIC_HTTP_CHECK },
    handler: 'updateCheck',
  },
  {
    method: 'bulkUpdateChecks',
    payload: { checks: [BASIC_HTTP_CHECK] },
    handler: 'bulkUpdateChecks',
  },
  {
    method: 'getTenant',
    payload: undefined,
    handler: 'getTenant',
  },
  {
    method: 'getTenantLimits',
    payload: undefined,
    handler: 'getTenantLimits',
  },
  {
    method: 'updateTenantSettings',
    payload: { settings: { thresholds: { alert: 1, warning: 2 } } },
    handler: 'updateTenantSettings',
  },
  {
    method: 'listAlertsForCheck',
    payload: 1,
    handler: 'listAlertsForCheck',
  },
  {
    method: 'updateAlertsForCheck',
    payload: [BASIC_CHECK_ALERTS.alerts[0], 1],
    handler: 'updateAlertsForCheck',
  },
  {
    method: 'createApiToken',
    payload: undefined,
    handler: 'createAccessToken',
  },
  {
    method: 'getSecrets',
    payload: undefined,
    handler: 'listSecrets',
  },
  {
    method: 'getSecret',
    payload: 'new-secret',
    handler: 'getSecret',
  },
  {
    method: 'saveSecret',
    payload: { name: `new-secret` },
    handler: 'createSecret',
  },
  {
    method: 'saveSecret',
    payload: { uuid: 1, name: `update-secret` },
    handler: 'updateSecret',
  },
  {
    method: 'deleteSecret',
    payload: `delete-secret`,
    handler: 'deleteSecret',
  },
];

describe('SMDataSource', () => {
  it.each(entries)('$method - sets the X-Client- headers', async ({ method, payload, handler }) => {
    const { record, read } = getServerRequests();
    server.use(apiRoute(handler, undefined, record));

    const smDataSource = new SMDataSource(SM_DATASOURCE);
    await smDataSource[method](...(Array.isArray(payload) ? payload : [payload]));

    const { request } = await read(undefined, false);

    expect(request.headers.get('X-Client-ID')).toEqual(process.env.SM_PLUGIN_ID);
    expect(request.headers.get('X-Client-Version')).toEqual(process.env.SM_PLUGIN_VERSION);
  });

  describe('getLogsDS', () => {
    beforeEach(() => {
      config.datasources = {};
    });

    it('should return the configured datasource when it exists', () => {
      config.datasources = {
        [LOGS_DATASOURCE.name]: LOGS_DATASOURCE,
      };

      const smDataSource = new SMDataSource(SM_DATASOURCE);
      const result = smDataSource.getLogsDS();

      expect(result).toEqual(LOGS_DATASOURCE);
      expect(result?.uid).toEqual('P4DC6B4C9A7FFCC6C');
    });

    it('should fall back to default grafanacloud-logs UID when configured datasource does not exist', () => {
      const defaultLogsDS = { ...LOGS_DATASOURCE, uid: 'grafanacloud-logs' };
      config.datasources = {
        [defaultLogsDS.name]: defaultLogsDS,
      };

      const smDataSourceWithMissingConfig = new SMDataSource({
        ...SM_DATASOURCE,
        jsonData: {
          ...SM_DATASOURCE.jsonData,
          logs: {
            ...SM_DATASOURCE.jsonData.logs,
            uid: 'non-existent-uid',
          },
        },
      });

      const result = smDataSourceWithMissingConfig.getLogsDS();

      expect(result).toEqual(defaultLogsDS);
      expect(result?.uid).toEqual('grafanacloud-logs');
    });

    it('should respect custom datasource configuration', () => {
      const lbacLogsDS = {
        ...LOGS_DATASOURCE,
        uid: 'grafanacloud-logs-lbac',
        name: 'grafanacloud-ckbedwellksix-logs-lbac',
      };

      config.datasources = {
        [lbacLogsDS.name]: lbacLogsDS,
      };

      const smDataSourceWithLBAC = new SMDataSource({
        ...SM_DATASOURCE,
        jsonData: {
          ...SM_DATASOURCE.jsonData,
          logs: {
            ...SM_DATASOURCE.jsonData.logs,
            uid: 'grafanacloud-logs-lbac',
            grafanaName: 'grafanacloud-ckbedwellksix-logs-lbac',
          },
        },
      });

      const result = smDataSourceWithLBAC.getLogsDS();

      expect(result).toEqual(lbacLogsDS);
      expect(result?.uid).toEqual('grafanacloud-logs-lbac');
    });
  });

  describe('getMetricsDS', () => {
    beforeEach(() => {
      config.datasources = {};
    });

    it('should return the configured datasource when it exists', () => {
      config.datasources = {
        [METRICS_DATASOURCE.name]: METRICS_DATASOURCE,
      };

      const smDataSource = new SMDataSource(SM_DATASOURCE);
      const result = smDataSource.getMetricsDS();

      expect(result).toEqual(METRICS_DATASOURCE);
      expect(result?.uid).toEqual('P4DCEA413A673ADCC');
    });

    it('should fall back to default grafanacloud-metrics UID when configured datasource does not exist', () => {
      const defaultMetricsDS = { ...METRICS_DATASOURCE, uid: 'grafanacloud-metrics' };
      config.datasources = {
        [defaultMetricsDS.name]: defaultMetricsDS,
      };

      const smDataSourceWithMissingConfig = new SMDataSource({
        ...SM_DATASOURCE,
        jsonData: {
          ...SM_DATASOURCE.jsonData,
          metrics: {
            ...SM_DATASOURCE.jsonData.metrics,
            uid: 'non-existent-uid',
          },
        },
      });

      const result = smDataSourceWithMissingConfig.getMetricsDS();

      expect(result).toEqual(defaultMetricsDS);
      expect(result?.uid).toEqual('grafanacloud-metrics');
    });
  });

  describe('listChecks', () => {
    it('should normalize empty alertSensitivity to AlertSensitivity.None', async () => {
      const checkWithEmptySensitivity = { ...BASIC_HTTP_CHECK, alertSensitivity: '' };
      const checkWithSetSensitivity = { ...BASIC_HTTP_CHECK, alertSensitivity: AlertSensitivity.Medium };

      server.use(
        apiRoute('listChecks', {
          result: () => ({
            json: [checkWithEmptySensitivity, checkWithSetSensitivity],
          }),
        })
      );

      const smDataSource = new SMDataSource(SM_DATASOURCE);
      const result = await smDataSource.listChecks();

      expect(result[0].alertSensitivity).toEqual(AlertSensitivity.None);
      expect(result[1].alertSensitivity).toEqual(AlertSensitivity.Medium);
    });
  });
});
