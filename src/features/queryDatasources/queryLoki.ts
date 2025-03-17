import { queryDS } from 'features/queryDatasources/queryDS';

export function queryLoki({
  datasource,
  query,
  start,
  end,
  refId,
}: {
  datasource: { uid: string; type: string };
  query: string;
  start: number;
  end: number;
  refId: string;
}) {
  // todo: make recursive and handle stitching together results
  // need to order the logs here rather than later to know what end time to use
  // for recursive queries

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
  });
}
