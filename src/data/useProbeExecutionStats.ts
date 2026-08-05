import { type QueryKey, useQuery } from '@tanstack/react-query';
import { DataFrame } from '@grafana/data';
import { queryNamedQuery } from 'features/queryDatasources/queryNamedQuery';

import { QueryType } from 'datasource/types';
import { useSMDS } from 'hooks/useSMDS';
import { STANDARD_REFRESH_INTERVAL } from 'components/constants';

import { getStartEnd } from './utils';

const QUERY_KEY_EXEC: QueryKey = ['probe_check_execution_rate'];
const QUERY_KEY_FAIL: QueryKey = ['probe_check_failure_rate'];

const MILLISECONDS_PER_SECOND = 1000;

/**
 * The value for one probe.
 *
 * These queries aggregate `by (probe)`, so the datasource returns a frame per
 * probe with the label on the value field.
 */
function valueForProbe(frames: DataFrame[] | undefined, probeName: string): number | null {
  const frame = frames?.find((f) => f.fields?.[1]?.labels?.probe === probeName);
  const value = frame?.fields?.[1]?.values?.[0];

  return typeof value === 'number' ? value : null;
}

export function useProbesExecutionStats() {
  const smDS = useSMDS();

  const namedQuery = (queryType: QueryType, refId: string) => () => {
    const { start, end } = getStartEnd();

    return queryNamedQuery({
      datasource: smDS.instanceSettings,
      queryType,
      refId,
      from: start * MILLISECONDS_PER_SECOND,
      to: end * MILLISECONDS_PER_SECOND,
    });
  };

  const execQuery = useQuery({
    // 'now' moves, so it is deliberately not part of the key
    queryKey: [...QUERY_KEY_EXEC, smDS.uid],
    queryFn: namedQuery(QueryType.ProbeExecutionRate, 'probe_execution_rate'),
    refetchInterval: STANDARD_REFRESH_INTERVAL,
  });

  const failQuery = useQuery({
    queryKey: [...QUERY_KEY_FAIL, smDS.uid],
    queryFn: namedQuery(QueryType.ProbeFailureRate, 'probe_failure_rate'),
    refetchInterval: STANDARD_REFRESH_INTERVAL,
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

  return {
    ...rest,
    executionsPerSec: probeName ? valueForProbe(execResults, probeName) : null,
    failuresPerSec: probeName ? valueForProbe(failResults, probeName) : null,
  };
}
