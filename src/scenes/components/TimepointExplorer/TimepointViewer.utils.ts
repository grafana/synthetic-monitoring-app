import { CheckLogs, PerCheckLogs } from 'features/parseCheckLogs/checkLogs.types';
import { StatelessTimepoint } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';

export function filterProbes(data: PerCheckLogs[], timepoint: StatelessTimepoint) {
  return data.map((d) => {
    const { checks } = d;

    return {
      ...d,
      checks: filterExecutions(checks, timepoint),
    };
  });
}

export function filterExecutions(executions: CheckLogs[], timepoint: StatelessTimepoint) {
  return executions.filter((e) => {
    const startingLog = e[0];

    if (!startingLog) {
      return false;
    }

    const timepointStart = timepoint.adjustedTime;
    const timepointEnd = timepoint.adjustedTime + timepoint.timepointDuration;

    return startingLog.Time >= timepointStart && startingLog.Time <= timepointEnd;
  });
}
