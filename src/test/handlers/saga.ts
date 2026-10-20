import { sagaMetadata, sagaQueryResponse } from 'test/fixtures/saga';

import { ApiEntry } from './types';

// Registered for explicit test overrides of the shared Grafana query endpoint.
export const getSagaScreenshot: ApiEntry = {
  route: '/api/ds/query',
  method: 'post',
  result: async (req) => {
    const { queries } = await req.json();
    return { json: sagaQueryResponse(sagaMetadata(queries[0].refId)) };
  },
};
