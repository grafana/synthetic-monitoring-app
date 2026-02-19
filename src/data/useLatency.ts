import { type QueryKey, useQuery } from '@tanstack/react-query';

import { Check, CheckType } from 'types';
import { getCheckType } from 'utils';
import { MetricLatency } from 'datasource/responses.types';
import { getStartEnd, queryInstantMetric } from 'data/utils';
import { useMetricsDS } from 'hooks/useMetricsDS';
import { DEFAULT_QUERY_FROM_TIME, STANDARD_REFRESH_INTERVAL } from 'components/constants';

const QUERY_KEYS: Record<'latencies', QueryKey> = {
  latencies: ['latencies'],
};

export function useLatency({ job, target, settings }: Check) {
  const metricsDS = useMetricsDS();
  const url = metricsDS?.url || '';
  const type = getCheckType(settings);

  return useQuery({
    queryKey: [...QUERY_KEYS.latencies, url, job, target, type, metricsDS],
    queryFn: () => {
      if (!metricsDS) {
        return Promise.reject(`You need to have a metrics datasource available.`);
      }

      return queryInstantMetric<MetricLatency>({ url, query: getQuery(job, target, type), ...getStartEnd() });
    },
    refetchInterval: (query) => STANDARD_REFRESH_INTERVAL,
    select: (data) => {
      if (data) {
        return data[0];
      }

      return data;
    },
    enabled: Boolean(metricsDS),
  });
}

function getQuery(job: Check['job'], target: Check['target'], type: CheckType) {
  // TODO: find a way to dynamically check what metrics are available in the scripted check so can more accurately report latency
  // making assumption that all scripted checks are utilizing http protocol currently so this will report incorrectly for scripted checks using other protocols
  if (type === CheckType.MultiHttp || type === CheckType.Scripted) {
    return `sum by (job, instance) (sum_over_time(probe_http_total_duration_seconds{job="${job}", instance="${target}"}[${DEFAULT_QUERY_FROM_TIME}])) / sum by (job, instance) (count_over_time(probe_http_total_duration_seconds{job="${job}", instance="${target}"}[${DEFAULT_QUERY_FROM_TIME}])) `;
  }

  return `sum((rate(probe_all_duration_seconds_sum{probe=~".*", instance="${target}", job="${job}"}[${DEFAULT_QUERY_FROM_TIME}]) OR rate(probe_duration_seconds_sum{probe=~".*", instance="${target}", job="${job}"}[${DEFAULT_QUERY_FROM_TIME}]))) / sum((rate(probe_all_duration_seconds_count{probe=~".*", instance="${target}", job="${job}"}[${DEFAULT_QUERY_FROM_TIME}]) OR rate(probe_duration_seconds_count{probe=~".*", instance="${target}", job="${job}"}[${DEFAULT_QUERY_FROM_TIME}])))`;
}
