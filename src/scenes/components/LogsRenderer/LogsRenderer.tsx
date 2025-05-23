import React from 'react';

import { UnknownParsedLokiRecord } from 'features/parseLogs/parseLogs.types';
import { LogsRaw } from 'scenes/components/LogsRenderer/LogsRaw';
import { LogsTimeline } from 'scenes/components/LogsRenderer/LogsTimeline';
import { LogsView } from 'scenes/components/LogsRenderer/LogsViewSelect';
import { LogsWaterfall } from 'scenes/components/LogsRenderer/LogsWaterfall';

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

  if (logsView === 'waterfall') {
    return <LogsWaterfall<T> {...props} />;
  }

  if (logsView === 'raw') {
    return <LogsRaw<T> {...props} />;
  }

  return null;
};
