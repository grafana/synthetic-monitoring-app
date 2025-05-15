import React from 'react';

import { UnknownParsedLokiRecord } from 'features/parseLogs/parseLogs.types';

export const LogsWaterfall = <T extends UnknownParsedLokiRecord>({ logs, mainKey }: { logs: T[]; mainKey: string }) => {
  return (
    <div>
      {logs.map((log) => (
        <div key={log.id}>{log.labels[mainKey]}</div>
      ))}
    </div>
  );
};
