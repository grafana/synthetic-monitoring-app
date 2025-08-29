import { useMemo } from 'react';

import { useTimepointExplorerContext } from 'scenes/components/TimepointExplorer/TimepointExplorer.context';
import { StatefulTimepoint, StatelessTimepoint } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import { getCouldBePending } from 'scenes/components/TimepointExplorer/TimepointExplorer.utils';

export function useStatefulTimepoints(timepoints: StatelessTimepoint[]): StatefulTimepoint[] {
  const { currentAdjustedTime, listLogsMap, yAxisMax } = useTimepointExplorerContext();

  return useMemo(() => {
    return timepoints.map<StatefulTimepoint>((timepoint) => {
      // Get stateful timepoint from listLogsMap or create default (same as useStatefulTimepoint hook)
      const entry = listLogsMap[timepoint.adjustedTime];

      if (!entry) {
        const couldBePending = getCouldBePending(timepoint, currentAdjustedTime);

        const UNKNOWN_STATE: StatefulTimepoint = {
          adjustedTime: timepoint.adjustedTime,
          config: timepoint.config,
          probeResults: {},
          index: timepoint.index,
          maxProbeDuration: yAxisMax / 3,
          timepointDuration: timepoint.timepointDuration,
          status: couldBePending ? 'pending' : 'missing',
        };

        return UNKNOWN_STATE;
      }

      return entry;
    });
  }, [timepoints, currentAdjustedTime, listLogsMap, yAxisMax]);
}
