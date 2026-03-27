import { LOG_LABELS_COMMON, LOG_LABELS_SM } from 'features/parseCheckLogs/checkLogs.constants.labels';

import { LokiFieldNames, ParsedLokiRecord } from 'features/parseLokiLogs/parseLokiLogs.types';

import { SCREENSHOT_LABEL_KEYS } from './screenshots/screenshots.constants';

export function uniqueLabels(log: ParsedLokiRecord<Record<string, string>, Record<string, string>>) {
  return Object.keys(log[LokiFieldNames.Labels]).filter(
    (key) =>
      !LOG_LABELS_COMMON.includes(key) &&
      !LOG_LABELS_SM.includes(key) &&
      key !== 'msg' &&
      !key.includes(`_extracted`) &&
      !key.includes(`label_`) &&
      key !== 'time' &&
      !(SCREENSHOT_LABEL_KEYS as readonly string[]).includes(key)
  );
}
