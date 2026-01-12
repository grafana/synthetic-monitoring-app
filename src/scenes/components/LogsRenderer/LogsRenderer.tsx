import React from 'react';

import { UnknownParsedLokiRecord } from 'features/parseLokiLogs/parseLokiLogs.types';
import { LogsEvent } from 'scenes/components/LogsRenderer/LogsEvent';
import { LogsRaw } from 'scenes/components/LogsRenderer/LogsRaw';
import { LogsView } from 'scenes/components/LogsRenderer/LogsViewSelect';

export const LogsRenderer = <T extends UnknownParsedLokiRecord>({
  logs,
  logsView,
  mainKey,
  errorLogsOnly,
  onErrorLogsOnlyChange,
}: {
  logs: T[];
  logsView: LogsView;
  mainKey: string;
  errorLogsOnly: boolean;
  onErrorLogsOnlyChange: (value: boolean) => void;
}) => {
  if (logsView === 'event') {
    return <LogsEvent<T> logs={logs} mainKey={mainKey} errorLogsOnly={errorLogsOnly} onErrorLogsOnlyChange={onErrorLogsOnlyChange} />;
  }

  if (logsView === 'raw-logs') {
    return <LogsRaw<T> logs={logs} errorLogsOnly={errorLogsOnly} onErrorLogsOnlyChange={onErrorLogsOnlyChange} />;
  }

  return null;
};
