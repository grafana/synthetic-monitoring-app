// logs contract with the backend
import { MSG_STRINGS_COMMON } from 'features/parseCheckLogs/checkLogs.constants.msgs';

export const LOG_LABELS_COMMON = [`detected_level`, `level`, `service_name`];
export const LOG_LABELS_SM = [
  'check_name', // check type e.g. http, multihttp, scripted, etc
  'instance',
  'job',
  'msg',
  'probe',
  'probe_success',
  'region',
  'source',
  `target`,
];

type CommonLogLabelsForMsg = {
  [key in keyof typeof MSG_STRINGS_COMMON]: string[];
};

export const LOG_LABELS_FOR_MSG_COMMON: CommonLogLabelsForMsg = {
  BeginningCheck: [`timeout_seconds`, `type`],
  CheckFailed: [`duration_seconds`],
  CheckSucceeded: [`duration_seconds`],
};
