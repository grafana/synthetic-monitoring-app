import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { AdHocHistoryListLabels, AdHocHistoryRun } from './adhocHistory.types';
import { useInfiniteLogs } from 'data/useInfiniteLogs';
import { useLogsRetentionPeriod } from 'data/useLogsRetention';
import { useSMDS } from 'hooks/useSMDS';
import { loggify } from 'components/Checkster/feature/adhoc-check/useAdHocLogs';

import {
  ADHOC_RUN_WINDOW_PADDING_MS,
  REF_ID_ADHOC_HISTORY_LIST,
  REF_ID_ADHOC_HISTORY_RUN,
} from './adhocHistory.constants';
import { buildAdHocHistoryListQuery, buildAdHocRunQuery, toAdHocHistoryRuns } from './adhocHistory.utils';

interface UseAdHocHistoryArgs {
  rangeMs: number;
  end: number;
}

export function useAdHocHistory({ rangeMs, end }: UseAdHocHistoryArgs) {
  const { retentionPeriod, isLoading: isLoadingRetention } = useLogsRetentionPeriod();
  // Loki rejects queries that reach further back than the logs retention period
  const effectiveRangeMs = retentionPeriod ? Math.min(rangeMs, retentionPeriod) : rangeMs;
  const start = end - effectiveRangeMs;

  const query = useInfiniteLogs<AdHocHistoryListLabels, Record<string, string>>({
    refId: REF_ID_ADHOC_HISTORY_LIST,
    expr: buildAdHocHistoryListQuery(),
    start: isLoadingRetention ? NaN : start,
    end,
  });

  const runs = useMemo(() => toAdHocHistoryRuns(query.data ?? []), [query.data]);

  return {
    ...query,
    isLoading: isLoadingRetention || query.isLoading,
    runs,
    isClampedToRetention: effectiveRangeMs < rangeMs,
  };
}

export function useAdHocRun(run: AdHocHistoryRun) {
  const dataSource = useSMDS();

  return useQuery({
    queryKey: ['logs', 'adhoc-history-run', run.id, run.time, run.lastTime],
    queryFn: async () => {
      const result = await dataSource.queryLogsV2(
        buildAdHocRunQuery(run.id),
        run.time - ADHOC_RUN_WINDOW_PADDING_MS,
        run.lastTime + ADHOC_RUN_WINDOW_PADDING_MS,
        REF_ID_ADHOC_HISTORY_RUN
      );

      if (!result.results[REF_ID_ADHOC_HISTORY_RUN]?.frames?.length) {
        return [];
      }

      return loggify(result, REF_ID_ADHOC_HISTORY_RUN).filter(({ line }) => line?.id === run.id);
    },
    staleTime: Infinity,
  });
}
