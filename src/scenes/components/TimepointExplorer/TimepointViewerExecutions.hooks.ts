import { ProbeExecutionLogs } from 'features/parseCheckLogs/checkLogs.types';
import { LokiFieldNames } from 'features/parseLokiLogs/parseLokiLogs.types';
import {
  useSelectedProbeNames,
  useStatefulTimepoint,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.hooks';
import { StatelessTimepoint } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import { TabToRender } from 'scenes/components/TimepointExplorer/TimepointViewerExecutions.types';
import { getProbeExecutionsStatus } from 'scenes/components/TimepointExplorer/TimepointViewerExecutions.utils';

interface UseTimepointViewerExecutionsProps {
  isLoading: boolean;
  pendingProbeNames: string[];
  probeExecutions: ProbeExecutionLogs[];
  timepoint: StatelessTimepoint;
}

export function useTimepointViewerExecutions({
  isLoading,
  pendingProbeNames,
  probeExecutions,
  timepoint,
}: UseTimepointViewerExecutionsProps) {
  const statefulTimepoint = useStatefulTimepoint(timepoint);
  const selectedProbeNames = useSelectedProbeNames(statefulTimepoint);

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

  return tabsToRender;
}
