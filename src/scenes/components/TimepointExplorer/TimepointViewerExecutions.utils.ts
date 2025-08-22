import { UnknownExecutionLog } from 'features/parseCheckLogs/checkLogs.types';
import { LokiFieldNames } from 'features/parseLokiLogs/parseLokiLogs.types';
import {
  StatelessTimepoint,
  TimepointStatus,
  UnixTimestamp,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import { TabToRender } from 'scenes/components/TimepointExplorer/TimepointViewerExecutions.types';

export function filterTabsToRender(
  latestConfigDate: UnixTimestamp,
  tabsToRender: TabToRender[],
  timepoint: StatelessTimepoint | null
) {
  const isCurrentConfig = latestConfigDate === timepoint?.config.from;

  return tabsToRender.filter((tab) => {
    if (isCurrentConfig) {
      return true;
    }

    return tab.status !== 'missing';
  });
}

interface GetProbeExecutionsStatusProps {
  executionLog: UnknownExecutionLog | undefined;
  pendingProbeNames: string[];
  probeName: string;
  isLoading: boolean;
}

export function getProbeExecutionsStatus({
  executionLog,
  pendingProbeNames,
  probeName,
  isLoading,
}: GetProbeExecutionsStatusProps): TimepointStatus {
  if (isLoading) {
    return 'pending';
  }

  if (!executionLog) {
    if (pendingProbeNames.includes(probeName)) {
      return 'pending';
    }

    return 'missing';
  }

  const probeStatus = executionLog[LokiFieldNames.Labels]?.probe_success;
  const isSuccess = probeStatus === '1';

  return isSuccess ? 'success' : 'failure';
}
