import { queryDS } from 'page/CheckDrilldown/utils/queryDS';

export function queryMimir({
  datasource,
  query,
  start,
  end,
  refId,
  interval,
  intervalMs,
}: {
  datasource: { uid: string; type: string };
  query: string;
  start: number;
  end: number;
  refId: string;
  interval: string;
  intervalMs: number;
}) {
  return queryDS({
    queries: [
      {
        refId,
        expr: query,
        queryType: 'range',
        datasource,
        intervalMs,
        interval,
        maxDataPoints: 8000,
      },
    ],
    start,
    end,
  });
}
