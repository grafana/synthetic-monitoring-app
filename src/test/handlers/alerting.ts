import { ApiEntry } from 'test/handlers/types';
import { DashboardResponse } from 'datasource/responses.types';

export const getDashboard: ApiEntry<DashboardResponse> = {
  route: `/api/ruler/1/api/v1/rules/synthetic_monitoring/default`,
  method: `get`,
  result: () => {
    return {
      json: {
        title: `A nice dashboard`,
        uid: Math.random().toString(),
        json: ``,
        version: 1,
      },
    };
  },
};
