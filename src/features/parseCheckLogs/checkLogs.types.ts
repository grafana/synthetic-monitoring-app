import { ParsedLokiRecord } from 'features/parseLogs/parseLogs.types';
import { CheckType } from 'types';

import { MSG_STRINGS_COMMON } from './checkLogs.constants.msgs';

export type CheckLabels<T extends Record<string, string> = {}> = T & {
  check_name: CheckType; // this is really check type e.g. http
  detected_level: 'error' | 'info'; // might be more
  instance: string;
  job: string;
  msg: string;
  probe: string;
  probe_success: '0' | '1';
  region: string; // might be undefined?
  service_name: string; // same as job
  source: 'synthetic-monitoring-agent'; // might be more?
};

export type CheckLabelType = {
  check_name: string; // I
  detected_level: string; // S
  instance: string; // I
  job: string; // I
};

export type ParsedCheckLog<T extends Record<string, string> = {}> = ParsedLokiRecord<CheckLabels<T>, CheckLabelType>;

export type StartingLog = ParsedCheckLog<{
  msg: (typeof MSG_STRINGS_COMMON)['BeginningCheck'];
}>;

export type EndingLogLabels = {
  duration_seconds: string;
};

export type CheckFailedLog = ParsedCheckLog<
  EndingLogLabels & {
    msg: (typeof MSG_STRINGS_COMMON)['CheckFailed'];
  }
>;

export type CheckSucceededLog = ParsedCheckLog<
  EndingLogLabels & {
    msg: (typeof MSG_STRINGS_COMMON)['CheckSucceeded'];
  }
>;

export type CheckEndedLog = CheckFailedLog | CheckSucceededLog;

export type UnknownCheckLog = ParsedCheckLog;

export type CheckLogs = [StartingLog, ...UnknownCheckLog[], CheckEndedLog];

export type PerCheckLogs = {
  probe: string;
  checks: CheckLogs[];
};
