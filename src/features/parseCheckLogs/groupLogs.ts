import { MSG_STRINGS_COMMON } from 'features/parseCheckLogs/checkLogs.constants.msgs';

import { CheckLogs, LabelsWithTime, PerCheckLogs } from 'features/parseCheckLogs/checkLogs.types';

export function groupLogs(logs: LabelsWithTime[]): PerCheckLogs[] {
  const groupedByProbe = groupByProbe(logs);
  const groupedByCheck = Object.entries(groupedByProbe).map(([probe, logs]) => ({
    probe,
    checks: groupByCheck(logs),
  }));

  return groupedByCheck;
}

export function groupByProbe(orderedLogs: LabelsWithTime[]) {
  const res = orderedLogs.reduce<Record<string, LabelsWithTime[]>>((acc, log) => {
    const probe = log.value.probe;

    if (!acc[probe]) {
      acc[probe] = [];
    }

    acc[probe].push(log);

    return acc;
  }, {});

  return res;
}

export function groupByCheck(logs: LabelsWithTime[]): CheckLogs[] {
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
    const msg = log.value.msg;

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
  logs: LabelsWithTime[];
  matchMsg: string[];
  reverse?: boolean;
}) {
  const copy = [...logs];
  const direction = reverse ? -1 : 1;
  const start = reverse ? copy.length - 1 : 0;

  for (let i = start; i < logs.length; i += direction) {
    const msg = logs[i].value.msg;

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
