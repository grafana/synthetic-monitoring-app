import { checksLogs1 } from 'test/fixtures/httpCheck/checkLogs';
import { PROM_UNIQUE_CONFIGS } from 'test/fixtures/httpCheck/promUniqueConfigs';

import { ApiEntry } from 'test/handlers/types';
import {
  REF_ID_EXECUTION_LIST_LOGS,
  REF_ID_UNIQUE_CHECK_CONFIGS,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.constants';

export interface DatasourceQueryRequest {
  from: string;
  to: string;
  queries: Array<{ refId: string; expr: string }>;
}

export const queryDatasource: ApiEntry = {
  route: `/api/ds/query`,
  method: `post`,
  result: async (req) => {
    const url = new URL(req.url);
    const refId = url.searchParams.get(`refId`);

    if (refId === REF_ID_UNIQUE_CHECK_CONFIGS) {
      return {
        json: PROM_UNIQUE_CONFIGS,
      };
    }

    if (refId?.startsWith(REF_ID_EXECUTION_LIST_LOGS)) {
      return {
        // todo: fix this
        json: checksLogs1(`checkLogs-1745503200000`),
      };
    }

    const { queries } = (await req.json()) as DatasourceQueryRequest;
    return { json: { results: Object.fromEntries(queries.map(({ refId }) => [refId, { frames: [] }])) } };
  },
};
