import { REF_ID_ADHOC_HISTORY_LIST, REF_ID_ADHOC_HISTORY_RUN } from 'features/adhocHistory/adhocHistory.constants';
import { ADHOC_HISTORY_LINES, adHocHistoryListResponse, adHocRunResponse } from 'test/fixtures/adhocHistory';

import { ApiEntry } from 'test/handlers/types';

// Shares the /api/ds/query route with other Loki/Prometheus handlers, so it isn't reachable as a
// default handler: tests opt in with `server.use(apiRoute('getAdHocHistoryLogs'))`.
export const getAdHocHistoryLogs: ApiEntry<unknown> = {
  route: `/api/ds/query`,
  method: `post`,
  result: async (req) => {
    const url = new URL(req.url);
    const refId = url.searchParams.get(`refId`);
    const body = await req.clone().json();
    const query = body?.queries?.[0];

    if (refId?.startsWith(REF_ID_ADHOC_HISTORY_LIST)) {
      return { json: adHocHistoryListResponse(refId) };
    }

    if (query?.refId === REF_ID_ADHOC_HISTORY_RUN) {
      const lines = ADHOC_HISTORY_LINES.filter((line) => query.expr.includes(String(line.body.id)));

      return { json: adHocRunResponse(REF_ID_ADHOC_HISTORY_RUN, lines) };
    }

    return { json: { results: {} } };
  },
};
