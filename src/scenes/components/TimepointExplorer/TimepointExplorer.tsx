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
  const initialTimeRangeToInView = useMemo(
    () => new Date(timeshiftedTimepoint(timeRangeTo, check.frequency)),
    [timeRangeTo, check.frequency]
  );

  const { timepointsInRange } = useTimepointExplorer({ timeRange, check });
  const { handleTimeRangeToInViewChange, ref, timepointsToDisplay, viewTimeRangeTo, width, miniMapSections } =
    useTimepointExplorerView(timepointsInRange, initialTimeRangeToInView);

  const drillProps: TimepointExplorerChild = useMemo(() => {
    return {
      handleTimeRangeToInViewChange,
      miniMapSections,
      timepointsInRange,
      timepointsToDisplay,
      timeRange,
      viewTimeRangeTo,
      width,
    };
  }, [
    handleTimeRangeToInViewChange,
    miniMapSections,
    timepointsInRange,
    timepointsToDisplay,
    timeRange,
    viewTimeRangeTo,
    width,
  ]);

  console.log(drillProps);

  return (
    <Stack direction="column" gap={2}>
      <TimepointList {...drillProps} ref={ref} />
      <TimepointMinimap {...drillProps} />
    </Stack>
  );
}
