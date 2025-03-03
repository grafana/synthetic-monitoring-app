import { LOG_LABELS_COMMON, LOG_LABELS_SM } from 'features/logParsing/logs.constants.labels';

import { Label, LabelsWithTime, LokiSeries, Time } from 'features/logParsing/logs.types';

// ensure to send logfmt to Loki so the line is fully parsed
export function parseLokiLogs(dataFrame: LokiSeries) {
  const labels = dataFrame.fields.find((field) => field.name === 'labels');
  const time = dataFrame.fields.find((field) => field.name === 'Time');
  const orderedLogs = assignTime<Label>(time, labels?.values);
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

export function extractMessages(values: LabelsWithTime[]) {
  const uniqueMessages = new Map<string, string[]>();

  if (!values) {
    return uniqueMessages;
  }

  values.forEach(({ value }) => {
    const msg = value['msg'];

    if (msg) {
      const labelsForMsg = Object.keys(value)
        .filter((key) => key !== 'msg' && !key.includes(`_extracted`) && !key.includes(`label_`))
        .filter((key) => !LOG_LABELS_COMMON.includes(key) && !LOG_LABELS_SM.includes(key))
        .sort();

      uniqueMessages.set(msg, labelsForMsg);
    }
  });

  return uniqueMessages;
}
