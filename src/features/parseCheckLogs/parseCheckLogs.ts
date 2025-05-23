import { MSG_STRINGS_COMMON } from 'features/parseCheckLogs/checkLogs.constants.msgs';

import { CheckLogs, ParsedCheckLog, PerCheckLogs, UnknownCheckLog } from 'features/parseCheckLogs/checkLogs.types';

export function parseCheckLogs(logs: UnknownCheckLog[]): PerCheckLogs[] {
  const groupedByProbe = groupByProbe(logs);
  const groupedByCheck = Object.entries(groupedByProbe).map(([probe, logs]) => ({
    probe,
    checks: groupByCheck(logs),
  }));

  return groupedByCheck;
}

export function groupByProbe(orderedLogs: ParsedCheckLog[]) {
  const res = orderedLogs.reduce<Record<string, ParsedCheckLog[]>>((acc, log) => {
    const probe = log.labels.probe;

    if (!acc[probe]) {
      acc[probe] = [];
    }

    acc[probe].push(log);

    return acc;
  }, {});

  return res;
}

export function groupByCheck(logs: UnknownCheckLog[]): CheckLogs[] {
  const completeFromStart = discardIncompleteChecks({
    logs,
    matchMsg: [MSG_STRINGS_COMMON.BeginningCheck],
  });

  const completeFromEnd = discardIncompleteChecks({
    logs: completeFromStart,
    matchMsg: [MSG_STRINGS_COMMON.CheckSucceeded, MSG_STRINGS_COMMON.CheckFailed],
    reverse: true,
  });

  const checks = [];
  let check = [];

  for (const log of completeFromEnd) {
    const msg = log.labels.msg;

    check.push(log);

    if ([MSG_STRINGS_COMMON.CheckFailed, MSG_STRINGS_COMMON.CheckSucceeded].includes(msg)) {
      checks.push(check);
      check = [];
    }
  }

  return checks as CheckLogs[];
}

export function discardIncompleteChecks({
  logs,
  matchMsg,
  reverse = false,
}: {
  logs: UnknownCheckLog[];
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
