import React from 'react';

import { ExecutionLogs } from 'features/parseCheckLogs/checkLogs.types';
import { UnknownParsedLokiRecord } from 'features/parseLogs/parseLogs.types';
import { Check } from 'types';
import { LogsRaw } from 'scenes/components/LogsRenderer/LogsRaw';
import { LogsTimeline } from 'scenes/components/LogsRenderer/LogsTimeline';
import { LogsView } from 'scenes/components/LogsRenderer/LogsViewSelect';
import { TraceAndSpans } from 'scenes/components/LogsRenderer/TraceAndSpans';
import { checkToTrace } from 'scenes/components/LogsRenderer/TraceAndSpans.utils';
import { SelectedTimepoint } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';

export const LogsRenderer = <T extends UnknownParsedLokiRecord>({
  check,
  logs,
  logsView,
  mainKey,
  selectedTimepoint,
}: {
  check: Check;
  logs: T[];
  logsView: LogsView;
  mainKey: string;
  selectedTimepoint: SelectedTimepoint;
}) => {
  const props = { logs, mainKey, selectedTimepoint, check };

  if (logsView === 'timeline') {
    return <LogsTimeline<T> {...props} />;
  }

  if (logsView === 'trace') {
    const trace = checkToTrace(logs as unknown as ExecutionLogs);
    return <TraceAndSpans trace={trace} />;
  }

  if (logsView === 'raw') {
    return <LogsRaw<T> {...props} />;
  }

  return null;
};
