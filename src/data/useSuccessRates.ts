import { type QueryKey, useQuery } from '@tanstack/react-query';

import { Check } from 'types';
import { queryMetric } from 'utils';
import { MetricCheckSuccess, MetricProbeSuccessRate } from 'datasource/responses.types';
import { useMetricsDS } from 'hooks/useMetricsDS';
import { STANDARD_REFRESH_INTERVAL } from 'components/constants';
import { getMinStepFromFrequency } from 'scenes/utils';

import { findCheckinMetrics } from './utils';

const queryKeys: Record<'checkReachability' | 'checkUptime' | 'probeReachability', QueryKey> = {
  checkReachability: ['check_reachability'],
  checkUptime: ['check_uptime'],
  probeReachability: ['probe_reachability'],
};

export function useChecksReachabilitySuccessRate() {
  const { options } = useQueryMetric();
  const metricsDS = useMetricsDS();
  const url = metricsDS?.url || ``;
  const query =
    'sum(rate(probe_all_success_sum[3h])) by (job, instance) / sum(rate(probe_all_success_count[3h])) by (job, instance)';

  return useQuery({
    // we add 'now' as an option so can't add it to the query key
    // otherwise it would continuously refetch
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: [...queryKeys.checkReachability, query, url],
    queryFn: () => {
      if (!metricsDS) {
        return Promise.reject(`You need to have a metrics datasource available.`);
      }

      return queryMetric<MetricCheckSuccess>(url, query, options);
    },
    refetchInterval: (query) => STANDARD_REFRESH_INTERVAL,
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
  const { options } = useQueryMetric(getMinStepFromFrequency(check.frequency));
  const metricsDS = useMetricsDS();
  const url = metricsDS?.url || ``;

  const query = `
  ceil(
    sum by (instance, job) (increase(probe_all_success_sum{instance="${check.target}", job="${check.job}"}[3h]))
    /
    (sum by (instance, job) (increase(probe_all_success_count{instance="${check.target}", job="${check.job}"}[3h])) + 1)
  )`;

  return useQuery({
    // we add 'now' as an option so can't add it to the query key
    // otherwise it would continuously refetch
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: [...queryKeys.checkUptime, query, url],
    queryFn: () => {
      if (!metricsDS) {
        return Promise.reject(`You need to have a metrics datasource available.`);
      }

      return queryMetric<MetricCheckSuccess>(url, query, options);
    },
    refetchInterval: (query) => STANDARD_REFRESH_INTERVAL,
    enabled: Boolean(metricsDS),
  });
}

export function useProbesReachabilitySuccessRate() {
  const { options } = useQueryMetric();
  const metricsDS = useMetricsDS();
  const url = metricsDS?.url || ``;
  const query = 'sum(rate(probe_all_success_sum[3h])) by (probe) / sum(rate(probe_all_success_count[3h])) by (probe)';

  return useQuery({
    // we add 'now' as an option so can't add it to the query key
    // otherwise it would continuously refetch
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: [...queryKeys.probeReachability, query, url],
    queryFn: () => {
      if (!metricsDS) {
        return Promise.reject(`You need to have a metrics datasource available.`);
      }

      return queryMetric<MetricProbeSuccessRate>(url, query, options);
    },
    refetchInterval: (query) => STANDARD_REFRESH_INTERVAL,
    enabled: Boolean(metricsDS),
  });
}

export function useProbeReachabilitySuccessRate(probeName?: string) {
  const props = useProbesReachabilitySuccessRate();
  const probe = props.data?.find((d) => d.metric.probe === probeName);

  return {
    ...props,
    data: probe,
  };
}

function useQueryMetric(interval?: string) {
  const now = Math.floor(Date.now() / 1000);
  const threeHoursAgo = now - 60 * 60 * 3;

  const options = {
    start: threeHoursAgo,
    end: now,
    step: 0,
    interval,
  };

  return { options };
}
