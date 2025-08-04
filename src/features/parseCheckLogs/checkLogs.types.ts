import { ParsedLokiRecord } from 'features/parseLogs/parseLogs.types';
import { CheckType } from 'types';

import { MSG_STRINGS_COMMON } from './checkLogs.constants.msgs';

export type ExecutionLabels<T extends Record<string, string> = {}> = T & {
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

export type ExecutionLabelType = {
  check_name: string; // I
  detected_level: string; // S
  instance: string; // I
  job: string; // I
};

export type ParsedExecutionLog<T extends Record<string, string> = {}> = ParsedLokiRecord<
  ExecutionLabels<T>,
  ExecutionLabelType
>;

export type StartingLog = ParsedExecutionLog<{
  msg: (typeof MSG_STRINGS_COMMON)['BeginningCheck'];
}>;

export type EndingLogLabels = {
  duration_seconds: string;
};

export type ExecutionFailedLog = ParsedExecutionLog<
  EndingLogLabels & {
    msg: (typeof MSG_STRINGS_COMMON)['CheckFailed'];
  }
>;

export type ExecutionSucceededLog = ParsedExecutionLog<
  EndingLogLabels & {
    msg: (typeof MSG_STRINGS_COMMON)['CheckSucceeded'];
  }
>;

export type ExecutionEndedLog = ExecutionFailedLog | ExecutionSucceededLog;

export type UnknownExecutionLog = ParsedExecutionLog;

export type ExecutionLogs = [StartingLog, ...UnknownExecutionLog[], ExecutionEndedLog];

export type PerExecutionLogs = {
  probe: string;
  executions: ExecutionLogs[];
};
