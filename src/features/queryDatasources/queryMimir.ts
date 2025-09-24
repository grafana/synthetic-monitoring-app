import { DataFrame, Field } from '@grafana/data';
import { queryDS } from 'features/queryDatasources/queryDS';

interface MimirDataFrame extends DataFrame {
  fields: Array<Field<number>>;
}

export function queryMimir<T>({
  datasource,
  query,
  start,
  end,
  refId,
  interval,
  intervalMs,
  queryType,
  maxDataPoints,
}: {
  datasource: { uid: string; type: string };
  query: string;
  start: number;
  end: number;
  refId: string;
  interval?: string;
  intervalMs?: number;
  queryType: 'range' | 'instant';
  maxDataPoints?: number;
}) {
  return queryDS({
    queries: [
      {
        refId,
        expr: query,
        range: queryType === 'range',
        instant: queryType === 'instant',
        datasource,
        intervalMs,
        interval,
        maxDataPoints,
      },
    ],
    start,
    end,
  }).then((data: Record<string, MimirDataFrame[]>) => {
    const dataframes = data[refId];

    return dataframes;
  });
}
