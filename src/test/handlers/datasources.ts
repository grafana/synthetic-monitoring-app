import { LOGS_DATASOURCE, METRICS_DATASOURCE, SM_DATASOURCE } from 'test/fixtures/datasources';

import { ApiEntry } from 'test/handlers/types';
import { DashboardResponse } from 'datasource/responses.types';

export const getSMDS: ApiEntry<DashboardResponse> = {
  route: `/api/datasources/uid/${SM_DATASOURCE.uid}`,
  method: `get`,
  result: (req) => {
    return {
      json: SM_DATASOURCE,
    };
  },
};

export const getMetricsDS: ApiEntry<DashboardResponse> = {
  route: `/api/datasources/uid/${METRICS_DATASOURCE.uid}`,
  method: `get`,
  result: (req) => {
    return {
      json: METRICS_DATASOURCE,
    };
  },
};

export const getLogsDS: ApiEntry<DashboardResponse> = {
  route: `/api/datasources/uid/${LOGS_DATASOURCE.uid}`,
  method: `get`,
  result: (req) => {
    return {
      json: LOGS_DATASOURCE,
    };
  },
};
