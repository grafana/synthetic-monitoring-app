import { http, HttpResponse } from 'msw';
import { getAlertRules, getGrafanaAlertRules, getPromAlertRules } from 'test/handlers/alerting';
import {
  addCheck,
  bulkUpdateChecks,
  checkInfo,
  deleteCheck,
  listChecks,
  testCheck,
  updateCheck,
} from 'test/handlers/checks';
import { getDashboard } from 'test/handlers/dashboards';
import { getLogsDS, getMetricsDS, getSMDS } from 'test/handlers/datasources';
import { getHttpDashboard } from 'test/handlers/httpDashboard';
import { getInstantMetrics, getRangeMetrics } from 'test/handlers/metrics';
import { addProbe, deleteProbe, listProbes, updateProbe } from 'test/handlers/probes';
import { getTenant, getTenantLimits, getTenantSettings, updateTenantSettings } from 'test/handlers/tenants';
import { createAccessToken } from 'test/handlers/tokens';

import { ApiEntry } from 'test/handlers/types';

import { listAlertsForCheck, updateAlertsForCheck } from './alerts';
import { listK6Channels } from './k6Channels';
import { createSecret, deleteSecret, getSecret, listSecrets, updateSecret } from './secrets';

const apiRoutes = {
  addCheck,
  addProbe,
  bulkUpdateChecks,
  checkInfo,
  createAccessToken,
  createSecret,
  deleteCheck,
  deleteProbe,
  deleteSecret,
  getAlertRules,
  getDashboard,
  getGrafanaAlertRules,
  getHttpDashboard,
  getInstantMetrics,
  getLogsDS,
  getMetricsDS,
  getPromAlertRules,
  getRangeMetrics,
  getSecret,
  getSMDS,
  getTenant,
  getTenantLimits,
  getTenantSettings,
  listAlertsForCheck,
  listChecks,
  listProbes,
  listSecrets,
  testCheck,
  updateAlertsForCheck,
  updateCheck,
  updateProbe,
  updateSecret,
  updateTenantSettings,
  listK6Channels,
};

export type ApiRoutes = typeof apiRoutes;

type ApiRoutesReturnTypes = {
  [K in keyof ApiRoutes]: ApiRoutes[K];
};

export function apiRoute<K extends keyof ApiRoutes>(
  routeKey: K,
  res?: Partial<ApiRoutesReturnTypes[K]>,
  callback?: (req: Request) => void
) {
  const defaultRes = apiRoutes[routeKey];
  let { route, method, result }: ApiEntry = {
    ...defaultRes,
    ...res,
  };

  let resultFunc = result;

  if (callback) {
    resultFunc = (req: Request) => {
      callback(req);
      return result(req);
    };
  }

  return toRestMethod({ route, method, result: resultFunc });
}

function toRestMethod({ route, method, result }: ApiEntry) {
  const urlPattern = new RegExp(`^http://localhost.*${route}(?:\\?.*)?$`);

  return http[method](urlPattern, async ({ request }) => {
    const { status = 200, json } = await result(request);

    return HttpResponse.json(json, { status });
  });
}

export function getServerRequests() {
  const requests: Request[] = [];
  const bodies = new Map<Request, Promise<any>>();

  const record = (request: Request) => {
    requests.push(request);
    
    // In MSW 2.x, request bodies can only be read once
    // Clone and cache the body promise immediately, before the handler consumes it
    const method = request.method.toUpperCase();
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      try {
        // Clone and parse JSON, catching both sync and async errors
        const bodyPromise = request.clone().json().catch(() => null);
        bodies.set(request, bodyPromise);
      } catch (e) {
        // If cloning fails, store a resolved null promise
        bodies.set(request, Promise.resolve(null));
      }
    }
  };
  
  const read = async (index = 0, readBody = true) => {
    const request = requests[index];
    let body;

    if (readBody && request && bodies.has(request)) {
      try {
        body = await bodies.get(request);
      } catch (e) {
        console.error(e);
      }
    }

    return { request, body };
  };

  return { record, read, requests };
}

export const handlers = Object.keys(apiRoutes).map((key) => apiRoute(key as keyof ApiRoutes));
