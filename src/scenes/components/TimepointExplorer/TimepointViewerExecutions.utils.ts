import { UnknownExecutionLog } from 'features/parseCheckLogs/checkLogs.types';
import { LokiFieldNames } from 'features/parseLokiLogs/parseLokiLogs.types';
import { TimepointStatus } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';

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
