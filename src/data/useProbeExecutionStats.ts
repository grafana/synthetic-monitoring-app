import { type QueryKey, useQuery } from '@tanstack/react-query';
import { getProbeExecutionRateQuery, getProbeFailureRateQuery } from 'queries/probeExecutionStats';

import { MetricProbeSuccessRate } from 'datasource/responses.types';
import { useMetricsDS } from 'hooks/useMetricsDS';
import { STANDARD_REFRESH_INTERVAL } from 'components/constants';

import { getStartEnd, queryInstantMetric } from './utils';

const QUERY_KEY_EXEC: QueryKey = ['probe_check_execution_rate'];
const QUERY_KEY_FAIL: QueryKey = ['probe_check_failure_rate'];

export function useProbesExecutionStats() {
  const metricsDS = useMetricsDS();
  const url = metricsDS?.url || ``;
  const execExpr = getProbeExecutionRateQuery();
  const failExpr = getProbeFailureRateQuery();

  const execQuery = useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: [...QUERY_KEY_EXEC, execExpr, url],
    queryFn: () => {
      if (!metricsDS) {
        return Promise.reject(`You need to have a metrics datasource available.`);
      }

      return queryInstantMetric<MetricProbeSuccessRate>({ url, query: execExpr, ...getStartEnd() });
    },
    refetchInterval: STANDARD_REFRESH_INTERVAL,
    enabled: Boolean(metricsDS),
  });

  const failQuery = useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: [...QUERY_KEY_FAIL, failExpr, url],
    queryFn: () => {
      if (!metricsDS) {
        return Promise.reject(`You need to have a metrics datasource available.`);
      }

      return queryInstantMetric<MetricProbeSuccessRate>({ url, query: failExpr, ...getStartEnd() });
    },
    refetchInterval: STANDARD_REFRESH_INTERVAL,
    enabled: Boolean(metricsDS),
  });

  return {
    execResults: execQuery.data,
    failResults: failQuery.data,
    isLoading: execQuery.isLoading || failQuery.isLoading,
    isFetching: execQuery.isFetching || failQuery.isFetching,
    isError: execQuery.isError || failQuery.isError,
  };
}

export function useProbeExecutionStats(probeName?: string) {
  const { execResults, failResults, ...rest } = useProbesExecutionStats();
  const exec = probeName ? execResults?.find((d) => d.metric.probe === probeName) : undefined;
  const fail = probeName ? failResults?.find((d) => d.metric.probe === probeName) : undefined;

  return {
    ...rest,
    executionsPerSec: exec?.value[1] ?? null,
    failuresPerSec: fail?.value[1] ?? null,
  };
}
