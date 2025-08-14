import { useEffect, useMemo } from 'react';

import { ExecutionLogs, PerExecutionLogs } from 'features/parseCheckLogs/checkLogs.types';
import { LokiFieldNames } from 'features/parseLogs/parseLogs.types';
import { useSceneVarProbes } from 'scenes/Common/useSceneVarProbes';
import { useTimepointExplorerContext } from 'scenes/components/TimepointExplorer/TimepointExplorer.context';
import { getExecutionIdFromLogs } from 'scenes/components/TimepointExplorer/TimepointViewer.utils';

type Status = 'pending' | 'success' | 'failure' | 'unknown';

interface TabToRender {
  probeName: string;
  executions: ExecutionLogs[];
  status: Status;
}

export function useTimepointViewerExecutions(data: PerExecutionLogs[], pendingExecutions: string[]) {
  const { check, handleSelectedTimepointChange, selectedTimepoint } = useTimepointExplorerContext();
  const [timepoint, executionToView] = selectedTimepoint;
  const selectedProbeNames = useSceneVarProbes(check);

  useEffect(() => {
    if (data.length && executionToView === undefined) {
      const id = getExecutionIdFromLogs(data[0].executions[0]);

      if (id) {
        handleSelectedTimepointChange(timepoint, id);
      }
    }
  }, [data, executionToView, handleSelectedTimepointChange, timepoint]);

  const tabsToRender = useMemo(() => {
    return selectedProbeNames
      .sort((a, b) => a.localeCompare(b))
      .map<TabToRender>((probeName) => {
        const perLogExecution = data.find((d) => d.probeName === probeName);

        return {
          probeName,
          executions: perLogExecution?.executions || [],
          status: getStatus(perLogExecution, pendingExecutions, probeName),
        };
      });
  }, [data, pendingExecutions, selectedProbeNames]);

  return tabsToRender;
}

function getStatus(
  perLogExecution: PerExecutionLogs | undefined,
  pendingExecutions: string[],
  probeName: string
): Status {
  if (!perLogExecution || perLogExecution.executions.length === 0) {
    if (pendingExecutions.includes(probeName)) {
      return 'pending';
    }

    return 'unknown';
  }

  const firstExecution = perLogExecution.executions[0] || [];
  const [firstLog] = firstExecution;
  const probeStatus = firstLog[LokiFieldNames.Labels]?.probe_success;
  const isSuccess = probeStatus === '1';

  return isSuccess ? 'success' : 'failure';
}
