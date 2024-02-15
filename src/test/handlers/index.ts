import { rest } from 'msw';
import { addCheck, checkInfo, listChecks, updateCheck } from 'test/handlers/checks';
import { addProbe, listProbes, updateProbe } from 'test/handlers/probes';
import { getTenant, getTenantSettings, updateTenantSettings } from 'test/handlers/tenants';

import { ApiEntry, RequestRes } from 'test/handlers/types';

const apiRoutes = {
  addProbe,
  listProbes,
  updateProbe,
  addCheck,
  checkInfo,
  listChecks,
  updateCheck,
  getTenant,
  getTenantSettings,
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

  if (callback) {
    result = (req: RequestRes) => {
      callback(req);
      return result(req);
    };
  }

  return toRestMethod({ route, method, result });
}

function toRestMethod({ route, method, result }: ApiEntry) {
  const url = `http://localhost${route}`;

  return rest[method](url, async (req, res, ctx) => {
    const { status = 200, json } = await result(req);

    return res(ctx.status(status), ctx.json(json));
  });
}

export function getServerRequest() {
  let request: RequestRes | undefined;

  const record = (req: RequestRes) => (request = req);
  const read = async () => {
    let body;
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
