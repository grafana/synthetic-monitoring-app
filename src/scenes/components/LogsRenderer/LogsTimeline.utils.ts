import { LokiFieldNames, ParsedLokiRecord } from 'features/parseLogs/parseLogs.types';

export function logDuations(logs: Array<ParsedLokiRecord<Record<string, string>, Record<string, string>>>) {
  return logs.map((log, i) => {
    return {
      ...log,
      durationNs: i > 0 ? log[LokiFieldNames.TsNs] - logs[i - 1][LokiFieldNames.TsNs] : 0,
    };
  });
}
