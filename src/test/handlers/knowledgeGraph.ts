import { ApiEntry } from './types';

export const getKGAssertionOrigins: ApiEntry = {
  route: /\/api\/datasources\/uid\/[^/]+\/resources\/api-server\/v1\/assertions/,
  method: 'post',
  result: () => ({ json: [] }),
};
