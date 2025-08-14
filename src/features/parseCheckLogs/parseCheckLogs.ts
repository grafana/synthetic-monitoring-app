import { MSG_STRINGS_COMMON } from 'features/parseCheckLogs/checkLogs.constants.msgs';

import {
  ExecutionLogs,
  ParsedExecutionLog,
  PerExecutionLogs,
  UnknownExecutionLog,
} from 'features/parseCheckLogs/checkLogs.types';

export function parseCheckLogs(logs: UnknownExecutionLog[]): PerExecutionLogs[] {
  const groupedByProbe = groupByProbe(logs);
  const groupedByCheck = Object.entries(groupedByProbe).map(([probeName, logs]) => {
    const executions = groupByExecution(logs);

    return {
      probeName,
      executions,
      id: logs[logs.length - 1].id, // use the last log id to id the check
    };
  });

  return groupedByCheck;
}

export function groupByProbe(orderedLogs: ParsedExecutionLog[]) {
  const res = orderedLogs.reduce<Record<string, ParsedExecutionLog[]>>((acc, log) => {
    const probe = log.labels.probe;

    if (!acc[probe]) {
      acc[probe] = [];
    }

    acc[probe].push(log);

    return acc;
  }, {});

  return res;
}

export function groupByExecution(logs: UnknownExecutionLog[]): ExecutionLogs[] {
  const completeFromStart = discardIncompleteChecks({
    logs,
    matchMsg: [MSG_STRINGS_COMMON.BeginningCheck],
  });

  const completeFromEnd = discardIncompleteChecks({
    logs: completeFromStart,
    matchMsg: [MSG_STRINGS_COMMON.CheckSucceeded, MSG_STRINGS_COMMON.CheckFailed],
    reverse: true,
  });

  const executions = [];
  let execution = [];

  for (const log of completeFromEnd) {
    const msg = log.labels.msg;

    execution.push(log);

    if ([MSG_STRINGS_COMMON.CheckFailed, MSG_STRINGS_COMMON.CheckSucceeded].includes(msg)) {
      executions.push(execution);
      execution = [];
    }
  }

  return executions as ExecutionLogs[];
}

export function discardIncompleteChecks({
  logs,
  matchMsg,
  reverse = false,
}: {
  logs: UnknownExecutionLog[];
  matchMsg: string[];
  reverse?: boolean;
}) {
  const copy = [...logs];
  const direction = reverse ? -1 : 1;
  const start = reverse ? copy.length - 1 : 0;

  for (let i = start; i < logs.length; i += direction) {
    if (!logs[i]) {
      break;
    }

    const msg = logs[i].labels.msg;

    if (matchMsg.includes(msg)) {
      break;
    }

    if (reverse) {
      copy.pop();
    } else {
      copy.shift();
    }
  }

  return copy;
}
