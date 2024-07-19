import { type QueryKey, useQuery } from '@tanstack/react-query';

import { Check, CheckType } from 'types';
import { getCheckType, queryMetric } from 'utils';
import { MetricLatency } from 'datasource/responses.types';
import { STANDARD_REFRESH_INTERVAL } from 'components/constants';

import { useMetricsDS } from './useMetricsDS';

const queryKeys: Record<'latencies', QueryKey> = {
  latencies: ['latencies'],
};

export function useLatency({ job, target, settings }: Check) {
  const metricsDS = useMetricsDS();
  const url = metricsDS.url;
  const type = getCheckType(settings);

  return useQuery({
    queryKey: [...queryKeys.latencies, url, job, target, type],
    // @ts-expect-error -- todo: look into if the url can ever be missing
    queryFn: () => queryMetric<MetricLatency>(url, getQuery(job, target, type)),
    refetchInterval: (query) => STANDARD_REFRESH_INTERVAL,
    select: (data) => {
      if (data) {
        return data[0];
      }

      return data;
    },
  });
}

function getQuery(job: Check['job'], target: Check['target'], type: CheckType) {
  // TODO: find a way to dynamically check what metrics are available in the scripted check so can more accurately report latency
  // making assumption that all scripted checks are utilizing http protocol currently so this will report incorrectly for scripted checks using other protocols
  if (type === CheckType.MULTI_HTTP || type === CheckType.Scripted) {
    return `sum by (job, instance) (sum_over_time(probe_http_total_duration_seconds{job="${job}", instance="${target}"}[6h])) / sum by (job, instance) (count_over_time(probe_http_total_duration_seconds{job="${job}", instance="${target}"}[6h])) `;
  }

  return `sum((rate(probe_all_duration_seconds_sum{probe=~".*", instance="${target}", job="${job}"}[6h]) OR rate(probe_duration_seconds_sum{probe=~".*", instance="${target}", job="${job}"}[6h]))) / sum((rate(probe_all_duration_seconds_count{probe=~".*", instance="${target}", job="${job}"}[6h]) OR rate(probe_duration_seconds_count{probe=~".*", instance="${target}", job="${job}"}[6h])))`;
}
