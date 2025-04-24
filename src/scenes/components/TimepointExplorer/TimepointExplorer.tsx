import React, { useMemo } from 'react';
import { useTimeRange } from '@grafana/scenes-react';
import { Stack } from '@grafana/ui';

import { Check } from 'types';
import {
  useTimepointExplorer,
  useTimepointExplorerView,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.hooks';
import { TimepointExplorerChild } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import { timeshiftedTimepoint } from 'scenes/components/TimepointExplorer/TimepointExplorer.utils';
import { TimepointList } from 'scenes/components/TimepointExplorer/TimepointList';
import { TimepointMinimap } from 'scenes/components/TimepointExplorer/TimepointMinimap';

interface TimepointExplorerProps {
  check: Check;
}

export function TimepointExplorer({ check }: TimepointExplorerProps) {
  const [timeRange] = useTimeRange();
  const timeRangeTo = timeRange.to.toDate().valueOf();
  const initialTimeRangeToInView = timeshiftedTimepoint(timeRangeTo, check.frequency);

  const { timepointsInRange } = useTimepointExplorer({ timeRange, check });
  const { ref, ...rest } = useTimepointExplorerView(timepointsInRange, initialTimeRangeToInView);

  const drillProps: TimepointExplorerChild = useMemo(() => {
    return {
      ...rest,
      timepointsInRange,
      timeRange,
    };
  }, [rest, timeRange, timepointsInRange]);

  console.log(drillProps);

  return (
    <div ref={ref}>
      <Stack direction="column" gap={2}>
        <TimepointList {...drillProps} />
        <TimepointMinimap {...drillProps} />
      </Stack>
    </div>
  );
}
