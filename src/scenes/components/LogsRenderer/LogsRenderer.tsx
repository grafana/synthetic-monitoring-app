import React from 'react';

import { UnknownParsedLokiRecord } from 'features/parseLogs/parseLogs.types';
import { Check } from 'types';
import { LogsEvent } from 'scenes/components/LogsRenderer/LogsEvent';
import { LogsRaw } from 'scenes/components/LogsRenderer/LogsRaw';
import { LogsView } from 'scenes/components/LogsRenderer/LogsViewSelect';
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

  if (logsView === 'event') {
    return <LogsEvent<T> {...props} />;
  }

  if (logsView === 'raw') {
    return <LogsRaw<T> {...props} />;
  }

  return null;
};
