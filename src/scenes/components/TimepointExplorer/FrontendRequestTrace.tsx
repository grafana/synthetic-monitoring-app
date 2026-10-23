import React from 'react';
import { DataSourceInstanceSettings } from '@grafana/data';
import { Button, Spinner, Stack, Text, TextLink } from '@grafana/ui';

import { getExploreTraceUrl } from 'scenes/components/LogsRenderer/TraceLink.utils';
import { TracePanel } from 'scenes/components/LogsRenderer/TracePanel';
import { useTraceData } from 'scenes/components/LogsRenderer/useTraceData';

export const FrontendRequestTrace = ({
  traceId,
  timestamp,
  tracesDS,
  onClose,
}: {
  traceId: string;
  timestamp: number;
  tracesDS: DataSourceInstanceSettings;
  onClose: () => void;
}) => {
  const {
    data: traceData,
    isLoading,
    isFetching,
    isError,
    isAwaitingPropagation,
    traceExists,
    refetch,
  } = useTraceData({ traceId, tracesDS, timestamp });

  if (isLoading) {
    return <Spinner />;
  }

  if (traceData && traceExists) {
    return (
      <TracePanel
        traceId={traceId}
        tracesDS={tracesDS}
        traceData={traceData}
        logTimestamp={timestamp}
        arrowOffset={null}
        onClose={onClose}
      />
    );
  }

  return (
    <Stack direction="column" gap={1}>
      <Text color="secondary" variant="bodySmall">
        {isError
          ? "Couldn't load the trace for this request."
          : isAwaitingPropagation
            ? 'Waiting for the trace to arrive…'
            : 'No trace found for this request. The backend may not have sampled it.'}
      </Text>
      <Stack direction="row" gap={1} alignItems="center">
        {isAwaitingPropagation && <Spinner size="sm" />}
        <Button size="sm" variant="secondary" onClick={() => refetch()} disabled={isFetching}>
          Retry trace lookup
        </Button>
        <TextLink href={getExploreTraceUrl(tracesDS.uid, traceId)} variant="bodySmall">
          Try in Explore
        </TextLink>
      </Stack>
    </Stack>
  );
};
