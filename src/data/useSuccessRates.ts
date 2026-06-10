import { type QueryKey, useQuery } from '@tanstack/react-query';
import { getChecksCurrentSuccessRateQuery, getOverallReachabilityQuery } from 'queries/checkStatus';
import { getUptimeQuery } from 'queries/uptime';

import { Check } from 'types';
import { MetricCheckSuccess } from 'datasource/responses.types';
import { useMetricsDS } from 'hooks/useMetricsDS';
import { DEFAULT_QUERY_FROM_TIME, STANDARD_REFRESH_INTERVAL } from 'components/constants';

import { findCheckinMetrics, getStartEnd, queryInstantMetric, queryRangeMetric } from './utils';

const QUERY_KEYS: Record<'checkReachability' | 'checkUptime' | 'checkCurrentState' | 'overallReachability', QueryKey> = {
  checkReachability: ['check_reachability'],
  checkUptime: ['check_uptime'],
  checkCurrentState: ['check_current_state'],
  overallReachability: ['overall_reachability'],
};

export function useChecksReachabilitySuccessRate() {
  const metricsDS = useMetricsDS();
  const url = metricsDS?.url || ``;
  const query =
    `sum(rate(probe_all_success_sum[${DEFAULT_QUERY_FROM_TIME}])) by (job, instance) / sum(rate(probe_all_success_count[${DEFAULT_QUERY_FROM_TIME}])) by (job, instance)`;

  return useQuery({
    // we add 'now' as an option so can't add it to the query key
    // otherwise it would continuously refetch
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: [...QUERY_KEYS.checkReachability, query, url],
    queryFn: () => {
      if (!metricsDS) {
        return Promise.reject(`You need to have a metrics datasource available.`);
      }

      return queryInstantMetric<MetricCheckSuccess>({ url, query, ...getStartEnd() });
    },
    refetchInterval: (query) => STANDARD_REFRESH_INTERVAL,
    enabled: Boolean(metricsDS),
  });
}

export function useChecksCurrentSuccessRate() {
  const metricsDS = useMetricsDS();
  const url = metricsDS?.url || ``;
  const query = getChecksCurrentSuccessRateQuery();

  return useQuery({
    // we add 'now' as an option so can't add it to the query key
    // otherwise it would continuously refetch
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: [...QUERY_KEYS.checkCurrentState, query, url],
    queryFn: () => {
      if (!metricsDS) {
        return Promise.reject(`You need to have a metrics datasource available.`);
      }

      return queryInstantMetric<MetricCheckSuccess>({ url, query, ...getStartEnd() });
    },
    refetchInterval: STANDARD_REFRESH_INTERVAL,
    enabled: Boolean(metricsDS),
  });
}

export function useOverallReachability() {
  const metricsDS = useMetricsDS();
  const url = metricsDS?.url || ``;
  const query = getOverallReachabilityQuery();

  return useQuery({
    // we add 'now' as an option so can't add it to the query key
    // otherwise it would continuously refetch
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: [...QUERY_KEYS.overallReachability, query, url],
    queryFn: () => {
      if (!metricsDS) {
        return Promise.reject(`You need to have a metrics datasource available.`);
      }

      return queryInstantMetric({ url, query, ...getStartEnd() });
    },
    select: (data): number | null => {
      const value = data[0]?.value[1];
      return typeof value === 'number' && !isNaN(value) ? value : null;
    },
    refetchInterval: STANDARD_REFRESH_INTERVAL,
    enabled: Boolean(metricsDS),
  });
}

export function useCheckReachabilitySuccessRate(check: Check) {
  const props = useChecksReachabilitySuccessRate();
  const checkSuccessRate = findCheckinMetrics(props.data || [], check);

  return {
    ...props,
    data: checkSuccessRate,
  };
}

export function useCheckUptimeSuccessRate(check: Check) {
  const metricsDS = useMetricsDS();
  const url = metricsDS?.url || ``;
  const { expr, interval } = getUptimeQuery({
    job: check.job,
    instance: check.target,
    frequency: check.frequency,
  });

  return useQuery({
    // we add 'now' as an option so can't add it to the query key
    // otherwise it would continuously refetch
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: [...QUERY_KEYS.checkUptime, expr, url],
    queryFn: async () => {
      if (!metricsDS) {
        return Promise.reject(`You need to have a metrics datasource available.`);
      }

      return queryRangeMetric({ url, query: expr, ...getStartEnd(), step: interval });
    },
    select: (data) => {
      const vals = data[0].values;
      const total = vals.reduce((acc, [_, value]) => {
        return acc + Number(value);
      }, 0);

      if (vals.length === 0) {
        return null;
      }

      return total / vals.length;
    },
    refetchInterval: (query) => STANDARD_REFRESH_INTERVAL,
    enabled: Boolean(metricsDS),
  });
}
