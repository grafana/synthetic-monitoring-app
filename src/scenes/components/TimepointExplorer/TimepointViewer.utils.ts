import { ExecutionEndedLog, ExecutionLogs, PerExecutionLogs } from 'features/parseCheckLogs/checkLogs.types';
import { LokiFieldNames } from 'features/parseLogs/parseLogs.types';
import { StatelessTimepoint } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';

export function filterProbes(data: PerExecutionLogs[], timepoint: StatelessTimepoint): PerExecutionLogs[] {
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

export function getExecutionIdFromLogs(execution: ExecutionLogs) {
  const endingLog = execution[execution.length - 1] as ExecutionEndedLog;

  return endingLog[LokiFieldNames.ID];
}
