import { type QueryKey, useQuery } from '@tanstack/react-query';
import { queryNamedQuery } from 'features/queryDatasources/queryNamedQuery';

import { Check } from 'types';
import { MetricCheckSuccess } from 'datasource/responses.types';
import { QueryType } from 'datasource/types';
import { useMetricsDS } from 'hooks/useMetricsDS';
import { useSMDS } from 'hooks/useSMDS';
import { DEFAULT_QUERY_FROM_TIME, STANDARD_REFRESH_INTERVAL } from 'components/constants';

import { findCheckinMetrics, getStartEnd, queryInstantMetric } from './utils';

const QUERY_KEYS: Record<'checkReachability' | 'checkUptime', QueryKey> = {
  checkReachability: ['check_reachability'],
  checkUptime: ['check_uptime'],
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

export function useCheckReachabilitySuccessRate(check: Check) {
  const props = useChecksReachabilitySuccessRate();
  const checkSuccessRate = findCheckinMetrics(props.data || [], check);

  return {
    ...props,
    data: checkSuccessRate,
  };
}

const MILLISECONDS_PER_SECOND = 1000;

/**
 * Uptime, asked of the Synthetic Monitoring datasource by name.
 *
 * The PromQL that used to live in `queries/uptime.ts` now lives in the backend
 * (`pkg/plugin/namedqueries.go`); this only passes the parameters it varies.
 */
export function useCheckUptimeSuccessRate(check: Check) {
  const smDS = useSMDS();

  return useQuery({
    // we add 'now' as an option so can't add it to the query key
    // otherwise it would continuously refetch
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: [...QUERY_KEYS.checkUptime, smDS.uid, check.job, check.target, check.frequency],
    queryFn: async () => {
      const { start, end } = getStartEnd();

      return queryNamedQuery({
        datasource: smDS.instanceSettings,
        queryType: QueryType.ChecksUptime,
        refId: 'check_uptime',
        params: {
          job: check.job,
          instance: check.target,
          frequency: check.frequency,
        },
        from: start * MILLISECONDS_PER_SECOND,
        to: end * MILLISECONDS_PER_SECOND,
      });
    },
    select: (frames) => {
      // a Prometheus range response: field 0 is time, field 1 the values
      const vals: number[] = frames[0]?.fields?.[1]?.values ?? [];

      if (vals.length === 0) {
        return null;
      }

      return vals.reduce((acc, value) => acc + Number(value), 0) / vals.length;
    },
    refetchInterval: (query) => STANDARD_REFRESH_INTERVAL,
  });
}
