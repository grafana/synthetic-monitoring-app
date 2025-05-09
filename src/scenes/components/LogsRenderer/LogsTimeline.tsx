import React from 'react';

import { ParsedLokiRecord } from 'features/parseLogs/parseLogs.types';

export const LogsTimeline = <T extends ParsedLokiRecord<Record<string, string>, Record<string, string>>>({
  logs,
  mainKey,
}: {
  logs: T[];
  mainKey: string;
}) => {
  return <div>LogsTimeline</div>;
};
