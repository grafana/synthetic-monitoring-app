import { queryDS } from 'page/CheckDrilldown/utils/queryDS';

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
  return queryDS({
    queries: [
      {
        refId,
        expr: query,
        queryType: 'range',
        datasource,
        intervalMs: 2000,
        maxLines: 1000,
      },
    ],
    start,
    end,
  });
}
