import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { MetricCheckSuccess } from 'datasource/responses.types';
import { useChecks } from 'data/useChecks';
import { getStartEnd, queryInstantMetric } from 'data/utils';
import { useMetricsDS } from 'hooks/useMetricsDS';
import { STANDARD_REFRESH_INTERVAL } from 'components/constants';

function buildChecksForUrlQuery(url: string): string {
  return `group by (job, instance) (probe_http_requests_total{name="${url}"} or probe_browser_web_vital_fcp{url="${url}"})`;
}

export function useChecksForUrl(url: string | undefined) {
  const metricsDS = useMetricsDS();
  const metricsUrl = metricsDS?.url || '';
  const { data: checks } = useChecks();

  const query = url ? buildChecksForUrlQuery(url) : '';

  const { data: metrics, isLoading: isLoadingMetrics } = useQuery({
    queryKey: ['checks-for-url', url, metricsUrl, query],
    queryFn: () => queryInstantMetric<MetricCheckSuccess>({ url: metricsUrl, query, ...getStartEnd() }),
    enabled: Boolean(metricsDS && url),
    refetchInterval: STANDARD_REFRESH_INTERVAL,
  });

  const matchedChecks = useMemo(() => {
    if (!checks || !metrics) {
      return [];
    }

    return checks.filter((check) =>
      metrics.some((m) => m.metric.job === check.job && m.metric.instance === check.target)
    );
  }, [checks, metrics]);

  return { data: matchedChecks, isLoading: isLoadingMetrics };
}
