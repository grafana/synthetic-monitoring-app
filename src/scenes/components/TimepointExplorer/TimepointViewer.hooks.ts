import { parseCheckLogs } from 'features/parseCheckLogs/parseCheckLogs';

import { CheckLabelType, UnknownCheckLog } from 'features/parseCheckLogs/checkLogs.types';
import { useInfiniteLogs } from 'data/useInfiniteLogs';
import { Timepoint } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import { filterProbes } from 'scenes/components/TimepointExplorer/TimepointViewer.utils';

export function useTimepointLogs(timepoint: Timepoint, job: string, instance: string) {
  const props = useInfiniteLogs<UnknownCheckLog['labels'], CheckLabelType>({
    refId: `${job}-${instance}-${timepoint.adjustedTime}`,
    expr: `{job="${job}", instance="${instance}"} | logfmt`,
    start: timepoint.adjustedTime - timepoint.timepointDuration * 2, // the beginning of the execution might have been in a pervious timepoint
    end: timepoint.adjustedTime,
  });

  const { data } = props;
  const parsedCheckLogs = data ? filterProbes(parseCheckLogs(data), timepoint) : [];
  console.log(parsedCheckLogs);

  return {
    ...props,
    data: parsedCheckLogs,
  };
}
