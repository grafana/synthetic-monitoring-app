import { useQuery } from '@tanstack/react-query';

import { InstantMetric } from 'datasource/responses.types';
import { getStartEnd, queryInstantMetric } from 'data/utils';
import { useMetricsDS } from 'hooks/useMetricsDS';

/** Fetches a single sm_check_info series to show real system labels from the tenant's data. */
export function useCheckInfoLabels(): {
  labels: Record<string, string> | undefined;
  loading: boolean;
  failed: boolean;
  noDatasource: boolean;
} {
  const metricsDS = useMetricsDS();
  const url = metricsDS?.url ?? '';
  // sm_check_info is the metric that carries user-defined labels, so it is the
  // one whose shape actually changes across label modes. topk keeps the
  // response to a single series; the preview only reads one.
  const query = 'topk(1, sm_check_info)';

  const { data, isLoading, isError } = useQuery({
    // getStartEnd() is time-dependent, so it can't be part of the query key
    // without causing continuous refetches.

    queryKey: ['labelMigrationSeriesPreview', query, url],
    queryFn: () => queryInstantMetric<InstantMetric>({ url, query, ...getStartEnd() }),
    enabled: Boolean(metricsDS),
    retry: false,
  });

  return {
    labels: data && data.length > 0 ? data[0].metric : undefined,
    loading: isLoading,
    failed: isError,
    noDatasource: !metricsDS,
  };
}
