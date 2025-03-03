import React from 'react';
import { Stack } from '@grafana/ui';

import { CheckLogs } from 'features/logParsing/logs.types';
import { LogLine } from 'scenes/Common/CheckLogs/LogLine';

interface CheckLogsDisplayProps {
  checkLogs: CheckLogs;
}

export const CheckLogsDisplay = ({ checkLogs }: CheckLogsDisplayProps) => {
  const logsStart = new Date(checkLogs[0].time).toLocaleString();
  const logsEnd = new Date(checkLogs[checkLogs.length - 1].time).toLocaleString();

  return (
    <Stack gap={1} direction="column">
      <div>
        <div>Logs from</div>
        <span>{logsStart}</span>
        <span>to</span>
        <span>{logsEnd}</span>
      </div>
      {checkLogs.map((log) => {
        return <LogLine key={log.value.msg} log={log} />;
      })}
    </Stack>
  );
};
