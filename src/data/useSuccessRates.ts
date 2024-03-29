import { useContext } from 'react';
import { type QueryKey, useQuery } from '@tanstack/react-query';

import { Check } from 'types';
import { queryMetric } from 'utils';
import { MetricCheckSuccess, MetricProbeSuccessRate } from 'datasource/responses.types';
import { InstanceContext } from 'contexts/InstanceContext';
import { STANDARD_REFRESH_INTERVAL } from 'components/constants';
import { getMinStepFromFrequency } from 'scenes/utils';

import { findCheckinMetrics } from './utils';

const queryKeys: Record<'checkReachability' | 'checkUptime' | 'probeReachability', QueryKey> = {
  checkReachability: ['check_reachability'],
  checkUptime: ['check_uptime'],
  probeReachability: ['probe_reachability'],
};

export function useChecksReachabilitySuccessRate() {
  const { url, options } = useQueryMetric();
  const query =
    'sum(rate(probe_all_success_sum[3h])) by (job, instance) / sum(rate(probe_all_success_count[3h])) by (job, instance)';

  return useQuery({
    // we add 'now' as an option so can't add it to the query key
    // otherwise it would continuously refetch
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: [...queryKeys.checkReachability, query, url],
    queryFn: () => queryMetric<MetricCheckSuccess>(url, query, options),
    refetchInterval: (query) => STANDARD_REFRESH_INTERVAL,
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
  const { url, options } = useQueryMetric(getMinStepFromFrequency(check.frequency));

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
    queryFn: () => queryMetric<MetricCheckSuccess>(url, query, options),
    refetchInterval: (query) => STANDARD_REFRESH_INTERVAL,
  });
}

export function useProbesReachabilitySuccessRate() {
  const { url, options } = useQueryMetric();
  const query = 'sum(rate(probe_all_success_sum[3h])) by (probe) / sum(rate(probe_all_success_count[3h])) by (probe)';

  return useQuery({
    // we add 'now' as an option so can't add it to the query key
    // otherwise it would continuously refetch
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: [...queryKeys.probeReachability, query, url],
    queryFn: () => queryMetric<MetricProbeSuccessRate>(url, query, options),
    refetchInterval: (query) => STANDARD_REFRESH_INTERVAL,
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
  const { instance } = useContext(InstanceContext);
  const url = instance.api?.getMetricsDS()?.url || ``;
  const now = Math.floor(Date.now() / 1000);
  const threeHoursAgo = now - 60 * 60 * 3;

  const options = {
    start: threeHoursAgo,
    end: now,
    step: 0,
    interval,
  };

  return { url, options };
}
