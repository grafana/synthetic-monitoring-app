import { queryDS } from 'features/queryDatasources/queryDS';

import { LokiDataFrame } from 'features/parseLokiLogs/parseLokiLogs.types';

export interface QueryLokiArgs {
  datasource: { uid: string; type: string };
  query: string;
  start: number;
  end: number;
  refId: string;
}

export function queryLoki<T, R>({ datasource, query, start, end, refId }: QueryLokiArgs) {
  return queryDS({
    queries: [
      {
        refId,
        expr: query,
        range: true,
        datasource,
        intervalMs: 2000,
        maxLines: 1000,
      },
    ],
    start,
    end,
  }).then((data) => {
    const dataFrames = data[refId] as Array<LokiDataFrame<T, R>>;

    return dataFrames;
  });
}
