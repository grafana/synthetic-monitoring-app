import { ParsedLokiRecord } from 'features/parseLokiLogs/parseLokiLogs.types';
import { CheckType } from 'types';

import { MSG_STRINGS_COMMON } from './checkLogs.constants.msgs';

export type ExecutionLabels<T extends Record<string, string> = {}> = T & {
  check_name: CheckType;
  detected_level: 'error' | 'info' | 'warn';
  instance: string;
  job: string;
  level: 'error' | 'info' | 'warn';
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

export type UnknownExecutionLog<T extends Record<string, string> = Record<string, string>> = ParsedLokiRecord<
  ExecutionLabels<T>,
  ExecutionLabelType
>;

export type StartingLogLabels = {
  msg: (typeof MSG_STRINGS_COMMON)['BeginningCheck'];
  timeout_seconds: string;
  type: CheckType;
};

export type FailedLogLabels = {
  probe_success: '0';
  msg: (typeof MSG_STRINGS_COMMON)['CheckFailed'];
  duration_seconds: string;
};

export type SucceededLogLabels = {
  probe_success: '1';
  msg: (typeof MSG_STRINGS_COMMON)['CheckSucceeded'];
  duration_seconds: string;
};

export type StartingLog = UnknownExecutionLog<StartingLogLabels>;
export type ExecutionFailedLog = UnknownExecutionLog<FailedLogLabels>;
export type ExecutionSucceededLog = UnknownExecutionLog<SucceededLogLabels>;
export type ExecutionEndedLog = UnknownExecutionLog<FailedLogLabels | SucceededLogLabels>;

export type ExecutionLogs = [StartingLog, ...UnknownExecutionLog[], ExecutionEndedLog];

export type ProbeExecutionLogs = {
  probeName: string;
  executions: ExecutionLogs[];
};
