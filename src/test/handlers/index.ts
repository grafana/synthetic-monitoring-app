import { rest } from 'msw';
import { getAlertRules } from 'test/handlers/alerting';
import { addCheck, bulkUpdateChecks, checkInfo, listChecks, updateCheck } from 'test/handlers/checks';
import { getDashboard } from 'test/handlers/dashboards';
import { getMetrics } from 'test/handlers/metrics';
import { addProbe, listProbes, updateProbe } from 'test/handlers/probes';
import { getTenant, getTenantSettings, updateTenantSettings } from 'test/handlers/tenants';

import { ApiEntry, RequestRes } from 'test/handlers/types';

const apiRoutes = {
  addCheck,
  addProbe,
  bulkUpdateChecks,
  checkInfo,
  getAlertRules,
  getDashboard,
  getMetrics,
  getTenant,
  getTenantSettings,
  listChecks,
  listProbes,
  updateCheck,
  updateProbe,
  updateTenantSettings,
};

export type ApiRoutes = typeof apiRoutes;

type ApiRoutesReturnTypes = {
  [K in keyof ApiRoutes]: ApiRoutes[K];
};

export function apiRoute<K extends keyof ApiRoutes>(
  routeKey: K,
  res?: Partial<ApiRoutesReturnTypes[K]>,
  callback?: (req: RequestRes) => void
) {
  const defaultRes = apiRoutes[routeKey];
  let { route, method, result }: ApiEntry = {
    ...defaultRes,
    ...res,
  };

  let resultFunc = result;

  if (callback) {
    resultFunc = (req: RequestRes) => {
      callback(req);
      return result(req);
    };
  }

  return toRestMethod({ route, method, result: resultFunc });
}

function toRestMethod({ route, method, result }: ApiEntry) {
  const url = `http://localhost${route}`;

  return rest[method](url, async (req, res, ctx) => {
    const { status = 200, json } = await result(req);

    return res(ctx.status(status), ctx.json(json));
  });
}

export function getServerRequests() {
  let requests: RequestRes[] = [];

  const record = (request: RequestRes) => requests.push(request);
  const read = async (index = 0) => {
    let body;
    const request = requests[index];

    try {
      const json = await request?.json();
      body = json;
    } catch (e) {
      console.error(e);
    }

    return {
      request,
      body,
    };
  };

  return { record, read };
}

export const handlers = Object.keys(apiRoutes).map((key) => apiRoute(key as keyof ApiRoutes));
