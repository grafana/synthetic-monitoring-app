import { ProbeExecutionLogs } from 'features/parseCheckLogs/checkLogs.types';
import { LokiFieldNames } from 'features/parseLokiLogs/parseLokiLogs.types';
import { useSceneVar } from 'scenes/Common/useSceneVar';
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
  probeNameToView: string;
  timepoint: StatelessTimepoint;
}

export function useTimepointViewerExecutions({
  isLoading,
  pendingProbeNames,
  probeExecutions,
  probeNameToView,
  timepoint,
}: UseTimepointViewerExecutionsProps) {
  const { check } = useTimepointExplorerContext();
  const probeVarRaw = useSceneVar('probe');
  const probeVar = useSceneVarProbes(check);
  const latestConfigDate = Math.round(check.modified! * 1000);
  const isCurrentConfig = timepoint.config.from === latestConfigDate;
  const probeNames = Object.values(probeExecutions).flatMap((d) => d.probeName);
  const probeNamesToView = probeNames.length ? probeNames : [probeNameToView];

  const selectedProbeNames = !isCurrentConfig && probeVarRaw.includes('.*') ? probeNamesToView : probeVar;

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
