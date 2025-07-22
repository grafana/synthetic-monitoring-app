import { useInfiniteQuery } from '@tanstack/react-query';
import { parseLokiLogs } from 'features/parseLogs/parseLokiLogs';
import { queryLoki } from 'features/queryDatasources/queryLoki';

import { ParsedLokiRecord } from 'features/parseLogs/parseLogs.types';
import { useLogsDS } from 'hooks/useLogsDS';

export type InfiniteLogsParams<T, R> = {
  refId: string;
  expr: string;
  start: number;
  end: number;
  refetchInterval?: number;
  onSuccess?: (data: Array<ParsedLokiRecord<T, R>>) => void;
};

export function useInfiniteLogs<T, R>({
  refId,
  expr,
  start,
  end,
  refetchInterval,
  onSuccess,
}: InfiniteLogsParams<T, R>) {
  const logsDS = useLogsDS();

  return useInfiniteQuery({
    queryKey: ['logs', expr, refId, logsDS, start, end],
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
    refetchInterval,
    select: (data): Array<ParsedLokiRecord<T, R>> => {
      const res = data.pages.flatMap((page) => page);
      onSuccess?.(res);
      return res;

      // computationally very expensive -- is it needed? Handle duplication on the frontend?
      const flattenedLogs = data.pages.flatMap((page) => page);
      const deduplicatedLogs = flattenedLogs.filter(
        (log, index, self) => index === self.findIndex((t) => t.id === log.id)
      );

      return deduplicatedLogs.reverse();
    },
  });
}
