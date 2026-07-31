import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { Check } from 'types';
import { MetricCheckSuccess, RangeMetric } from 'datasource/responses.types';
import { getCheckCompositeKey } from 'data/useCheckAlertStates';
import { useChecksReachabilitySuccessRate } from 'data/useSuccessRates';
import { getStartEnd, queryInstantMetric, queryRangeMetric } from 'data/utils';
import { useMetricsDS } from 'hooks/useMetricsDS';
import { STANDARD_REFRESH_INTERVAL } from 'components/constants';

type RangeCheckMetric = RangeMetric & {
  metric: {
    instance: string;
    job: string;
  };
};

// Instant "is the check currently up" — mirrors the state query the summary
// table uses, with a wider window so low-frequency checks still report.
const STATE_QUERY = `ceil(
  sum(rate(probe_all_success_sum[15m])) by (job, instance)
  /
  sum(rate(probe_all_success_count[15m])) by (job, instance)
)`;

// k6-based checks (scripted, browser, multihttp) emit probe_duration_seconds_*
// instead of probe_all_duration_seconds_* — union both, like the check list does.
const LATENCY_QUERY = `sum(rate(probe_all_duration_seconds_sum[3h]) or rate(probe_duration_seconds_sum[3h])) by (job, instance)
  /
  sum(rate(probe_all_duration_seconds_count[3h]) or rate(probe_duration_seconds_count[3h])) by (job, instance)`;

// A rate window needs at least two samples of a series inside it. Sizing it
// to 3x the slowest check's frequency keeps that true even with execution
// jitter (2x is marginal: a window can catch a single sample and go empty).
// The step stays fixed — a dense evaluation grid costs little and means young
// checks produce points as soon as they have two samples.
function getLatencyTrendQuery(checks: Check[]) {
  const maxFrequencySeconds = Math.max(...checks.map((check) => check.frequency), 60_000) / 1000;
  const windowSeconds = Math.max(600, maxFrequencySeconds * 3);
  const stepSeconds = 300;

  return {
    query: `sum(rate(probe_all_duration_seconds_sum[${windowSeconds}s]) or rate(probe_duration_seconds_sum[${windowSeconds}s])) by (job, instance)
  /
  sum(rate(probe_all_duration_seconds_count[${windowSeconds}s]) or rate(probe_duration_seconds_count[${windowSeconds}s])) by (job, instance)`,
    step: String(stepSeconds),
  };
}

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
  avgReachability?: number;
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

  const { data: reachability = [], isLoading: isLoadingReachability } = useChecksReachabilitySuccessRate();
  const { data: state = [], isLoading: isLoadingState } = useInstantByCheck('folder_check_state', STATE_QUERY);
  const { data: latency = [], isLoading: isLoadingLatency } = useInstantByCheck('folder_check_latency', LATENCY_QUERY);

  const trend = useMemo(() => getLatencyTrendQuery(checks), [checks]);

  const { data: latencyTrend = [] } = useQuery({
    // 'now' can't live in the query key or it would refetch continuously

    queryKey: ['folder_check_latency_trend', trend.query, trend.step, url],
    queryFn: () =>
      queryRangeMetric<RangeCheckMetric>({
        url,
        query: trend.query,
        step: trend.step,
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
        isUp: stateValue === undefined ? undefined : stateValue > 0,
        latencyTrend: trendMap.get(key)?.values as Array<[number, number]> | undefined,
      };
    };

    let upCount = 0;
    const downChecks: Check[] = [];
    let reachabilitySum = 0;
    let reachabilityCount = 0;

    checks.forEach((check) => {
      const summary = getSummary(check);
      if (summary.isUp === true) {
        upCount++;
      }
      if (summary.isUp === false) {
        downChecks.push(check);
      }
      if (summary.reachability !== undefined) {
        reachabilitySum += summary.reachability;
        reachabilityCount++;
      }
    });

    return {
      getSummary,
      upCount,
      downCount: downChecks.length,
      downChecks,
      avgReachability: reachabilityCount > 0 ? reachabilitySum / reachabilityCount : undefined,
      isLoading: isLoadingReachability || isLoadingState || isLoadingLatency,
    };
  }, [checks, reachability, state, latency, latencyTrend, isLoadingReachability, isLoadingState, isLoadingLatency]);
}

const DAYS_PER_MONTH = 31;

export function getExecutionsPerMonth(checks: Check[]): number {
  return checks.reduce((total, check) => {
    if (!check.frequency) {
      return total;
    }
    const perProbe = (DAYS_PER_MONTH * 24 * 60 * 60 * 1000) / check.frequency;
    return total + Math.round(perProbe * check.probes.length);
  }, 0);
}
