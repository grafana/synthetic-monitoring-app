import { ExecutionLogs, ProbeExecutionLogs } from 'features/parseCheckLogs/checkLogs.types';
import { StatelessTimepoint } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';

export function filterProbeExecutions(data: ProbeExecutionLogs[], timepoint: StatelessTimepoint): ProbeExecutionLogs[] {
  return data.map((d) => {
    const { executions } = d;

    return {
      ...d,
      executions: filterExecutions(executions, timepoint),
    };
  });
}

export function filterExecutions(executions: ExecutionLogs[], timepoint: StatelessTimepoint) {
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
