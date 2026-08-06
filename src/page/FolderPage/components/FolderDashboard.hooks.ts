import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAvgLatencyByCheckQuery } from 'queries/avgLatencyByCheck';
import { getLatencyTrendByCheckQuery } from 'queries/latencyTrendByCheck';
import { getUpStateByCheckQuery } from 'queries/upStateByCheck';

import { Check } from 'types';
import { MetricCheckSuccess, RangeMetric } from 'datasource/responses.types';
import { getCheckCompositeKey } from 'data/useCheckAlertStates';
import { useChecksReachabilitySuccessRate } from 'data/useSuccessRates';
import { getStartEnd, queryInstantMetric, queryRangeMetric } from 'data/utils';
import { useMetricsDS } from 'hooks/useMetricsDS';
import { DEFAULT_QUERY_FROM_TIME, STANDARD_REFRESH_INTERVAL } from 'components/constants';

type RangeCheckMetric = RangeMetric & {
  metric: {
    instance: string;
    job: string;
  };
};

const LATENCY_QUERY = getAvgLatencyByCheckQuery({ window: DEFAULT_QUERY_FROM_TIME }).expr;

export interface CheckMetricSummary {
  reachability?: number;
  latency?: number;
  isUp?: boolean;
  latencyTrend?: Array<[number, number]>;
}

export interface FolderCheckMetrics {
  getSummary: (check: Check) => CheckMetricSummary;
  upCount: number;
  downCount: number;
  downChecks: Check[];
  /** The weakest link — the check with the lowest reachability in the window. */
  worstReachability?: { check: Check; reachability: number };
  isLoading: boolean;
}

function useInstantByCheck(queryKey: string, query: string) {
  const metricsDS = useMetricsDS();
  const url = metricsDS?.url || '';

  return useQuery({
    // 'now' can't live in the query key or it would refetch continuously

    queryKey: [queryKey, query, url],
    queryFn: () => queryInstantMetric<MetricCheckSuccess>({ url, query, ...getStartEnd() }),
    refetchInterval: STANDARD_REFRESH_INTERVAL,
    enabled: Boolean(metricsDS),
  });
}

export function useFolderCheckMetrics(checks: Check[]): FolderCheckMetrics {
  const metricsDS = useMetricsDS();
  const url = metricsDS?.url || '';

  const stateQuery = useMemo(() => getUpStateByCheckQuery({ checks }).expr, [checks]);

  const { data: reachability = [], isLoading: isLoadingReachability } = useChecksReachabilitySuccessRate();
  const { data: state = [], isLoading: isLoadingState } = useInstantByCheck('folder_check_state', stateQuery);
  const { data: latency = [], isLoading: isLoadingLatency } = useInstantByCheck('folder_check_latency', LATENCY_QUERY);

  const trend = useMemo(() => getLatencyTrendByCheckQuery({ checks }), [checks]);

  const { data: latencyTrend = [] } = useQuery({
    // 'now' can't live in the query key or it would refetch continuously

    queryKey: ['folder_check_latency_trend', trend.expr, trend.interval, url],
    queryFn: () =>
      queryRangeMetric<RangeCheckMetric>({
        url,
        query: trend.expr,
        step: trend.interval,
        ...getStartEnd(),
      }),
    refetchInterval: STANDARD_REFRESH_INTERVAL,
    enabled: Boolean(metricsDS),
  });

  return useMemo(() => {
    const toMap = <T extends { metric: { instance: string; job: string } }>(entries: T[]) =>
      new Map(entries.map((entry) => [getCheckCompositeKey(entry.metric.job, entry.metric.instance), entry]));

    const reachabilityMap = toMap(reachability);
    const stateMap = toMap(state);
    const latencyMap = toMap(latency);
    const trendMap = toMap(latencyTrend);

    const getSummary = (check: Check): CheckMetricSummary => {
      const key = getCheckCompositeKey(check.job, check.target);
      const stateValue = stateMap.get(key)?.value?.[1];

      return {
        reachability: reachabilityMap.get(key)?.value?.[1],
        latency: latencyMap.get(key)?.value?.[1],
        // Non-finite values (NaN/Inf from degenerate queries) are unknown, not down.
        isUp: stateValue === undefined || !Number.isFinite(stateValue) ? undefined : stateValue > 0,
        // queryRangeMetric converts sample values to numbers at runtime, but
        // RangeMetric still types them as strings — hence the cast.
        latencyTrend: trendMap.get(key)?.values as Array<[number, number]> | undefined,
      };
    };

    let upCount = 0;
    const downChecks: Check[] = [];
    let worstReachability: FolderCheckMetrics['worstReachability'];

    checks.forEach((check) => {
      const summary = getSummary(check);
      if (summary.isUp === true) {
        upCount++;
      }
      if (summary.isUp === false) {
        downChecks.push(check);
      }
      if (
        summary.reachability !== undefined &&
        (!worstReachability || summary.reachability < worstReachability.reachability)
      ) {
        worstReachability = { check, reachability: summary.reachability };
      }
    });

    return {
      getSummary,
      upCount,
      downCount: downChecks.length,
      downChecks,
      worstReachability,
      isLoading: isLoadingReachability || isLoadingState || isLoadingLatency,
    };
  }, [checks, reachability, state, latency, latencyTrend, isLoadingReachability, isLoadingState, isLoadingLatency]);
}
