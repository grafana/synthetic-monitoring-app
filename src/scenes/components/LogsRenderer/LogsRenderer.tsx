import React from 'react';

import { UnknownParsedLokiRecord } from 'features/parseLokiLogs/parseLokiLogs.types';
import { LogsEvent } from 'scenes/components/LogsRenderer/LogsEvent';
import { LogsRaw } from 'scenes/components/LogsRenderer/LogsRaw';
import { LogsView } from 'scenes/components/LogsRenderer/LogsViewSelect';

export const LogsRenderer = <T extends UnknownParsedLokiRecord>({
  logs,
  logsView,
  mainKey,
}: {
  logs: T[];
  logsView: LogsView;
  mainKey: string;
}) => {
  if (logsView === 'event') {
    return <LogsEvent<T> logs={logs} mainKey={mainKey} />;
  }

  if (logsView === 'raw-logs') {
    return <LogsRaw<T> logs={logs} />;
  }

  return null;
};
