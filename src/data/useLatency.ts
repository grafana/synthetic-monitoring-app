import { useContext } from 'react';
import { type QueryKey, useSuspenseQuery } from '@tanstack/react-query';

import { Check, CheckType } from 'types';
import { checkType, queryMetric } from 'utils';
import { MetricLatency } from 'datasource/responses.types';
import { InstanceContext } from 'contexts/InstanceContext';
import { STANDARD_REFRESH_INTERVAL } from 'components/constants';

const queryKeys: Record<string, () => QueryKey> = {
  latencies: () => ['latencies'],
};

export function useLatency(check: Check) {
  const { instance } = useContext(InstanceContext);
  const url = instance.api?.getMetricsDS()?.url || ``;
  const query = getQuery(check);

  return useSuspenseQuery({
    queryKey: [queryKeys.latencies(), url, query],
    queryFn: () => queryMetric<MetricLatency>(url, query),
    refetchInterval: (query) => STANDARD_REFRESH_INTERVAL,
    select: (data) => {
      if (data) {
        return data[0];
      }

      return data;
    },
  });
}

function getQuery(check: Check) {
  const { job, target } = check;
  const type = checkType(check.settings);

  if (type === CheckType.MULTI_HTTP) {
    return `sum by (job, instance) (sum_over_time(probe_http_total_duration_seconds{job="${job}", instance="${target}"}[6h])) / sum by (job, instance) (count_over_time(probe_http_total_duration_seconds{job="${job}", instance="${target}"}[6h])) `;
  }

  return `sum((rate(probe_all_duration_seconds_sum{probe=~".*", instance="${target}", job="${job}"}[6h]) OR rate(probe_duration_seconds_sum{probe=~".*", instance="${target}", job="${job}"}[6h]))) / sum((rate(probe_all_duration_seconds_count{probe=~".*", instance="${target}", job="${job}"}[6h]) OR rate(probe_duration_seconds_count{probe=~".*", instance="${target}", job="${job}"}[6h])))`;
}
