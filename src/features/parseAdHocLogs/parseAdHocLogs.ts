import { parseLokiLogs } from 'features/parseLogs/parseLokiLogs';

import { LokiFieldNames, LokiSeries } from 'features/parseLogs/parseLogs.types';

export type AdHocLog = LokiSeries<string, string>;

export function parseAdHocLogs(logs: AdHocLog[]) {
  const lineParser = (value: string) => JSON.parse(value);

  const adhocParser = {
    [LokiFieldNames.Line]: lineParser,
  };

  const parsedLogs = logs.map((log) => parseLokiLogs(log, adhocParser));

  return parsedLogs;
}
