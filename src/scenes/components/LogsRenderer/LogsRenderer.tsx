import React from 'react';

import { UnknownParsedLokiRecord } from 'features/parseLogs/parseLogs.types';
import { Check } from 'types';
import { LogsEvent } from 'scenes/components/LogsRenderer/LogsEvent';
import { LogsRaw } from 'scenes/components/LogsRenderer/LogsRaw';
import { LogsView } from 'scenes/components/LogsRenderer/LogsViewSelect';

export const LogsRenderer = <T extends UnknownParsedLokiRecord>({
  check,
  logs,
  logsView,
  mainKey,
  startTime,
  endTime,
}: {
  check: Check;
  logs: T[];
  logsView: LogsView;
  mainKey: string;
  startTime: number;
  endTime: number;
}) => {
  const props = { logs, mainKey, check, startTime, endTime };

  if (logsView === 'event') {
    return <LogsEvent<T> {...props} />;
  }

  if (logsView === 'raw') {
    return <LogsRaw<T> {...props} />;
  }

  return null;
};
