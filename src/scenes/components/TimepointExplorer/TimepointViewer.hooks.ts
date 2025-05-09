import { parseCheckLogs } from 'features/parseCheckLogs/parseCheckLogs';

import { CheckLabelType, UnknownCheckLog } from 'features/parseCheckLogs/checkLogs.types';
import { useInfiniteLogs } from 'data/useInfiniteLogs';
import { Timepoint } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';

export function useTimepointLogs(timepoint: Timepoint, job: string, instance: string) {
  const props = useInfiniteLogs<UnknownCheckLog['labels'], CheckLabelType>({
    refId: `${job}-${instance}-${timepoint.adjustedTime}`,
    expr: `{job="${job}", instance="${instance}"} | logfmt`,
    start: timepoint.adjustedTime - timepoint.frequency,
    end: timepoint.adjustedTime,
  });

  const { data } = props;
  const paresedCheckLogs = data ? parseCheckLogs(data) : [];

  return {
    ...props,
    data: paresedCheckLogs,
  };
}
