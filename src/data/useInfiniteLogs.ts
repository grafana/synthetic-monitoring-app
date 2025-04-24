import { useInfiniteQuery } from '@tanstack/react-query';
import { parseLokiLogs } from 'features/parseLogs/parseLokiLogs';
import { queryLoki } from 'features/queryDatasources/queryLoki';

import { useLogsDS } from 'hooks/useLogsDS';

interface DeepLogsParams {
  refId: string;
  expr: string;
  start: number;
  end: number;
}

export function useInfiniteLogs<T, R>({ refId, expr, start, end }: DeepLogsParams) {
  const logsDS = useLogsDS();

  return useInfiniteQuery({
    queryKey: ['logs', expr, start, end, refId, logsDS],
    initialPageParam: end,
    queryFn: async ({ pageParam }) => {
      if (!logsDS) {
        throw new Error('Logs data source not found');
      }

      const pageRefId = `${refId}-${pageParam}`;

      const response = await queryLoki<T, R>({
        datasource: logsDS,
        query: expr,
        start,
        end: pageParam,
        refId: pageRefId,
      });

      return parseLokiLogs<T, R>(response);
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.length < 1000) {
        return undefined;
      }

      return lastPage[0].Time;
    },
    select: (data) => {
      const flattenedLogs = data.pages.flatMap((page) => page);
      const deduplicatedLogs = flattenedLogs.filter(
        (log, index, self) => index === self.findIndex((t) => t.id === log.id)
      );

      return deduplicatedLogs.reverse();
    },
  });
}
