import { ApiEntry } from './types';

export const listFaroSourceMaps: ApiEntry = {
  route: /\/api\/plugin-proxy\/grafana-kowalski-app\/api-proxy\/api\/v1\/app\/[^/]+\/sourcemaps$/,
  method: 'get',
  result: () => ({ json: { bundles: [] } }),
};
