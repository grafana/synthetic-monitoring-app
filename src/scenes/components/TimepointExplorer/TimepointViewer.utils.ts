import { CheckLogs, PerCheckLogs } from 'features/parseCheckLogs/checkLogs.types';
import { Timepoint } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';

export function filterProbes(data: PerCheckLogs[], timepoint: Timepoint) {
  return data.map((d) => {
    const { checks } = d;

    return {
      ...d,
      checks: filterExecutions(checks, timepoint),
    };
  });
}

export function filterExecutions(executions: CheckLogs[], timepoint: Timepoint) {
  return executions.filter((e) => {
    const lastLog = e[e.length - 1];

    if (!lastLog) {
      return false;
    }

    const timepointStart = timepoint.adjustedTime - timepoint.timepointDuration;
    const timepointEnd = timepoint.adjustedTime;

    return lastLog.Time >= timepointStart && lastLog.Time <= timepointEnd;
  });
}
