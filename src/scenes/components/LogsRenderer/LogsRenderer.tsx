import React from 'react';

import { CheckLogs } from 'features/parseCheckLogs/checkLogs.types';
import { UnknownParsedLokiRecord } from 'features/parseLogs/parseLogs.types';
import { LogsRaw } from 'scenes/components/LogsRenderer/LogsRaw';
import { LogsTimeline } from 'scenes/components/LogsRenderer/LogsTimeline';
import { LogsView } from 'scenes/components/LogsRenderer/LogsViewSelect';
import { TraceAndSpans } from 'scenes/components/LogsRenderer/TraceAndSpans';
import { checkToTrace } from 'scenes/components/LogsRenderer/TraceAndSpans.utils';

export const LogsRenderer = <T extends UnknownParsedLokiRecord>({
  logs,
  logsView,
  mainKey,
}: {
  logs: T[];
  logsView: LogsView;
  mainKey: string;
}) => {
  const props = { logs, mainKey };

  if (logsView === 'timeline') {
    return <LogsTimeline<T> {...props} />;
  }

  if (logsView === 'trace') {
    const trace = checkToTrace(logs as unknown as CheckLogs);
    console.log(trace);
    return <TraceAndSpans trace={trace} />;
  }

  if (logsView === 'raw') {
    return <LogsRaw<T> {...props} />;
  }

  return null;
};
