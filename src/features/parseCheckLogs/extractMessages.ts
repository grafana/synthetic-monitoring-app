import { LOG_LABELS_COMMON, LOG_LABELS_SM } from 'features/parseCheckLogs/checkLogs.constants.labels';

import { LabelsWithTime } from 'features/parseCheckLogs/checkLogs.types';

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
