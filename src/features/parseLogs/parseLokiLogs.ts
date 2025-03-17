import { LokiSeries, Time } from 'features/parseLogs/parseLogs.types';

// ensure to send logfmt to Loki so the line is fully parsed
export function parseLokiLogs<T, R>(dataFrame: LokiSeries<T, R>) {
  const labels = dataFrame.fields.find((field) => field.name === 'labels');
  const time = dataFrame.fields.find((field) => field.name === 'Time');
  const orderedLogs = assignTime<T>(time, labels?.values);
  // const messages = extractMessages(orderedLogs);

  return orderedLogs;
}

export function assignTime<T extends unknown>(time?: Pick<Time, 'values' | 'nanos'>, input?: T[]) {
  if (!input || !time) {
    return [];
  }

  const orderedLogs = time.values.map((t, index) => ({
    time: t,
    nanotime: t * 1e6 + time.nanos[index],
    value: input[index],
  }));

  return orderedLogs.sort((a, b) => a.nanotime - b.nanotime);
}
