import { ApiEntry } from 'test/handlers/types';

export const installPlugin: ApiEntry<{ accessToken: string }> = {
  route: /api\/plugin-proxy\/.*\/install/,
  method: `post`,
  result: () => {
    return {
      json: { accessToken: `test-access-token` },
    };
  },
};

export const createDatasource: ApiEntry = {
  route: `/api/datasources`,
  method: `post`,
  result: () => {
    return {
      json: { datasource: { uid: `sm-datasource-uid` } },
    };
  },
};
