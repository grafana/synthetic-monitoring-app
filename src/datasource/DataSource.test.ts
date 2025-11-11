import { BASIC_CHECK_ALERTS } from 'test/fixtures/checkAlerts';
import { BASIC_HTTP_CHECK } from 'test/fixtures/checks';
import { SM_DATASOURCE } from 'test/fixtures/datasources';
import { PRIVATE_PROBE } from 'test/fixtures/probes';
import { apiRoute, ApiRoutes, getServerRequests } from 'test/handlers';
import { server } from 'test/server';

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
});
