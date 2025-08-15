import { ProbeExecutionLogs } from 'features/parseCheckLogs/checkLogs.types';
import { useSceneVarProbes } from 'scenes/Common/useSceneVarProbes';
import { useTimepointExplorerContext } from 'scenes/components/TimepointExplorer/TimepointExplorer.context';
import { StatelessTimepoint } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import { getProbeExecutionsStatus } from 'scenes/components/TimepointExplorer/TimepointExplorer.utils';
import { TabToRender } from 'scenes/components/TimepointExplorer/TimepointViewerExecutions.types';
import { filterTabsToRender } from 'scenes/components/TimepointExplorer/TimepointViewerExecutions.utils';

export function useTimepointViewerExecutions(
  data: ProbeExecutionLogs[],
  pendingExecutions: string[],
  timepoint: StatelessTimepoint | null
) {
  const { check, checkConfigs } = useTimepointExplorerContext();
  const selectedProbeNames = useSceneVarProbes(check);

  const tabsToRender = selectedProbeNames
    .sort((a, b) => a.localeCompare(b))
    .map<TabToRender>((probeName) => {
      const probeExecutionLogs = data.find((d) => d.probeName === probeName);
      const logWithProbeSuccess = probeExecutionLogs?.executions[0][0];

      return {
        probeName,
        executions: probeExecutionLogs?.executions || [],
        status: getProbeExecutionsStatus(logWithProbeSuccess, pendingExecutions, probeName),
      };
    });

  return filterTabsToRender(tabsToRender, checkConfigs, timepoint);
}
