import React from 'react';

import { UnknownParsedLokiRecord } from 'features/parseLokiLogs/parseLokiLogs.types';
import { LogsEvent } from 'scenes/components/LogsRenderer/LogsEvent';
import { LogsRaw } from 'scenes/components/LogsRenderer/LogsRaw';
import { LogsView } from 'scenes/components/LogsRenderer/LogsViewSelect';

export const LogsRenderer = <T extends UnknownParsedLokiRecord>({
  logs,
  logsView,
  mainKey,
  from,
  to,
}: {
  logs: T[];
  logsView: LogsView;
  mainKey: string;
  from: number | string;
  to: number | string;
}) => {
  if (logsView === 'event') {
    return <LogsEvent<T> logs={logs} mainKey={mainKey} from={from} to={to} />;
  }

  if (logsView === 'raw-logs') {
    return <LogsRaw<T> logs={logs} />;
  }

  return null;
};
