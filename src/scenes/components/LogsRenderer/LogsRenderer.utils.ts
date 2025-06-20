import { LokiFieldNames, UnknownParsedLokiRecord } from 'features/parseLogs/parseLogs.types';

// investigate further
type EventSpan = {
  event: string;
  start: number;
  end: number;
  duration: number;
  info: Record<string, string>;
};

export function constructEventSpansFromLogs<T extends UnknownParsedLokiRecord>(logs: T[]): EventSpan[] {
  return logs.map((log) => ({
    event: log.labels.msg,
    start: log.Time,
    end: log.Time + log[LokiFieldNames.TsNs],
    duration: log[LokiFieldNames.TsNs],
    info: log.labels,
  }));
}
