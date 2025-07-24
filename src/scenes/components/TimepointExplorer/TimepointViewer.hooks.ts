import { parseCheckLogs } from 'features/parseCheckLogs/parseCheckLogs';

import { CheckLabelType, UnknownCheckLog } from 'features/parseCheckLogs/checkLogs.types';
import { useInfiniteLogs } from 'data/useInfiniteLogs';
import { StatelessTimepoint } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import { filterProbes } from 'scenes/components/TimepointExplorer/TimepointViewer.utils';

export function useTimepointLogs({
  timepoint,
  job,
  instance,
  refetchInterval,
}: {
  timepoint: StatelessTimepoint;
  job: string;
  instance: string;
  refetchInterval?: number;
}) {
  const props = useInfiniteLogs<UnknownCheckLog['labels'], CheckLabelType>({
    refId: `${job}-${instance}-${timepoint.adjustedTime}`,
    expr: `{job="${job}", instance="${instance}"} | logfmt`,
    start: timepoint.adjustedTime,
    end: timepoint.adjustedTime + timepoint.timepointDuration * 2,
    refetchInterval,
  });

  const { data } = props;
  const parsedCheckLogs = data ? filterProbes(parseCheckLogs(data), timepoint) : [];

  return {
    ...props,
    data: parsedCheckLogs,
  };
}
