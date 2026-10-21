import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DataSourceInstanceSettings } from '@grafana/data';

import { PROPAGATION_POLL_MS, PROPAGATION_WINDOW_MS } from './LogLine.constants';
import { fetchTraceData } from './LogLine.utils';

export function useTraceData({
  traceId,
  tracesDS,
  timestamp,
}: {
  traceId: string | undefined;
  tracesDS: DataSourceInstanceSettings | undefined;
  timestamp: number;
}) {
  const [expiredTimestamp, setExpiredTimestamp] = useState<number>();
  const datasource = tracesDS ? { uid: tracesDS.uid, type: tracesDS.type } : undefined;
  const query = useQuery({
    queryKey: ['trace', datasource, traceId],
    queryFn: () => fetchTraceData(traceId!, datasource!),
    enabled: !!traceId && !!tracesDS,
    // Missing traces can arrive later. Reopening the panel should retry them.
    staleTime: (query) => (query.state.data?.series.length ? Infinity : 0),
    refetchInterval: (query) => {
      if (
        query.state.data?.series.length ||
        expiredTimestamp === timestamp ||
        Date.now() - timestamp >= PROPAGATION_WINDOW_MS
      ) {
        return false;
      }
      return PROPAGATION_POLL_MS;
    },
  });

  const traceExists = Boolean(query.data?.series.length);
  const isAwaitingPropagation =
    !traceExists &&
    !query.isLoading &&
    expiredTimestamp !== timestamp &&
    Date.now() - timestamp < PROPAGATION_WINDOW_MS &&
    !!traceId &&
    !!tracesDS;

  useEffect(() => {
    if (!isAwaitingPropagation) {
      return;
    }
    const remaining = PROPAGATION_WINDOW_MS - (Date.now() - timestamp);
    // Record expiry explicitly: timers and Date.now can disagree at the deadline.
    const timer = setTimeout(() => setExpiredTimestamp(timestamp), Math.max(0, remaining));
    return () => clearTimeout(timer);
  }, [isAwaitingPropagation, timestamp]);

  return {
    data: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    refetch: query.refetch,
    traceExists,
    isAwaitingPropagation,
  };
}
