import { ProbeExecutionLogs } from 'features/parseCheckLogs/checkLogs.types';
import { LokiFieldNames } from 'features/parseLogs/parseLogs.types';
import { useSceneVarProbes } from 'scenes/Common/useSceneVarProbes';
import { useTimepointExplorerContext } from 'scenes/components/TimepointExplorer/TimepointExplorer.context';
import { StatelessTimepoint } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import { TabToRender } from 'scenes/components/TimepointExplorer/TimepointViewerExecutions.types';
import {
  filterTabsToRender,
  getProbeExecutionsStatus,
} from 'scenes/components/TimepointExplorer/TimepointViewerExecutions.utils';

interface UseTimepointViewerExecutionsProps {
  isLoading: boolean;
  pendingProbeNames: string[];
  probeExecutions: ProbeExecutionLogs[];
  timepoint: StatelessTimepoint | null;
}

export function useTimepointViewerExecutions({
  isLoading,
  pendingProbeNames,
  probeExecutions,
  timepoint,
}: UseTimepointViewerExecutionsProps) {
  const { check } = useTimepointExplorerContext();
  const selectedProbeNames = useSceneVarProbes(check);
  const latestConfigDate = Math.round(check.modified! * 1000);

  const tabsToRender = selectedProbeNames
    .sort((a, b) => a.localeCompare(b))
    .map<TabToRender>((probeName) => {
      const probeExecutionLogs = probeExecutions.find((d) => d.probeName === probeName);
      const executions = (probeExecutionLogs?.executions || []).sort((a, b) => {
        const aTime = a?.[0][LokiFieldNames.Time];
        const bTime = b?.[0][LokiFieldNames.Time];

        return aTime - bTime;
      });
      const executionLog = executions[0]?.[0];

      return {
        probeName,
        executions,
        status: getProbeExecutionsStatus({ executionLog, pendingProbeNames, probeName, isLoading }),
      };
    });

  return filterTabsToRender(latestConfigDate, tabsToRender, timepoint);
}
