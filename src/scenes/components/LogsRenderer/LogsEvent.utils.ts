import { LokiFieldNames, ParsedLokiRecord } from 'features/parseLokiLogs/parseLokiLogs.types';

interface LogWithDuration extends ParsedLokiRecord<Record<string, string>, Record<string, string>> {
  durationNs: number;
}

export function logDuations(
  logs: Array<ParsedLokiRecord<Record<string, string>, Record<string, string>>>
): LogWithDuration[] {
  return logs.map((log, i) => {
    return {
      ...log,
      durationNs: i > 0 ? log[LokiFieldNames.TsNs] - logs[i - 1][LokiFieldNames.TsNs] : 0,
    };
  });
}
