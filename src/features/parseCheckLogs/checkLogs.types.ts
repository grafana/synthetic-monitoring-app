import { LokiSeries, ParsedLokiRecord } from 'features/parseLogs/parseLogs.types';

import { MSG_STRINGS_COMMON } from './checkLogs.constants.msgs';

export type CheckLogsSeries = LokiSeries<CheckLabel, CheckLabelType>;

export type CheckLabel = Record<string, string> & {
  check_name: string; // this is really check type e.g. http
  detected_level: 'error' | 'info'; // might be more
  instance: string;
  job: string;
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

export type ParsedCheckLog = ParsedLokiRecord<CheckLabel, CheckLabelType>;

type StartingLog = ParsedCheckLog & {
  value: CheckLabel & {
    msg: (typeof MSG_STRINGS_COMMON)['BeginningCheck'];
  };
};

type CheckFailedLog = ParsedCheckLog & {
  value: CheckLabel & {
    msg: (typeof MSG_STRINGS_COMMON)['CheckFailed'];
  };
};

type CheckSucceededLog = ParsedCheckLog & {
  value: CheckLabel & {
    msg: (typeof MSG_STRINGS_COMMON)['CheckSucceeded'];
  };
};

type EndingLog = CheckFailedLog | CheckSucceededLog;

export type CheckLogs = [StartingLog, ...ParsedCheckLog[], EndingLog];

export type PerCheckLogs = {
  probe: string;
  checks: CheckLogs[];
};
