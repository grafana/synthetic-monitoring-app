import { ApiEntry } from 'test/handlers/types';
import { DashboardResponse } from 'datasource/responses.types';

export const getDashboard: ApiEntry<DashboardResponse> = {
  route: `/public/plugins/grafana-synthetic-monitoring-app/dashboards/*`,
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
