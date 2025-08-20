import { parseCheckLogs } from 'features/parseCheckLogs/parseCheckLogs';

import { ExecutionLabelType, UnknownExecutionLog } from 'features/parseCheckLogs/checkLogs.types';
import { useInfiniteLogs } from 'data/useInfiniteLogs';
import { REF_ID_EXECUTION_VIEWER_LOGS } from 'scenes/components/TimepointExplorer/TimepointExplorer.constants';
import { StatelessTimepoint } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import { filterProbes } from 'scenes/components/TimepointExplorer/TimepointViewer.utils';

interface UseTimepointLogsProps {
  timepoint: StatelessTimepoint;
  job: string;
  instance: string;
  probe?: string[];
  staleTime?: number;
}

export function useTimepointLogs({ timepoint, job, instance, probe, staleTime }: UseTimepointLogsProps) {
  const probeExpr = probe?.join('|') || '.*';

  const props = useInfiniteLogs<UnknownExecutionLog['labels'], ExecutionLabelType>({
    refId: `${REF_ID_EXECUTION_VIEWER_LOGS}-${job}-${instance}-${timepoint.adjustedTime}`,
    expr: `{job="${job}", instance="${instance}", probe=~"${probeExpr}"} | logfmt`,
    start: timepoint.adjustedTime,
    end: timepoint.adjustedTime + timepoint.timepointDuration + timepoint.config.frequency,
    staleTime,
  });

  const { data } = props;
  const parsedCheckLogs = data ? filterProbes(parseCheckLogs(data), timepoint) : [];

  return {
    ...props,
    data: parsedCheckLogs,
  };
}
