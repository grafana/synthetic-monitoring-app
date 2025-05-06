import React, { useMemo } from 'react';
import { useTimeRange } from '@grafana/scenes-react';
import { RadioButtonGroup, Stack } from '@grafana/ui';

import { Check } from 'types';
import { VIEW_OPTIONS } from 'scenes/components/TimepointExplorer/TimepointExplorer.constants';
import {
  useMaxProbeDuration,
  useTimepointExplorerView,
  useTimepoints,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.hooks';
import { TimepointExplorerChild, UnixTimestamp } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import { timeshiftedTimepoint } from 'scenes/components/TimepointExplorer/TimepointExplorer.utils';
import { TimepointList } from 'scenes/components/TimepointExplorer/TimepointList';
import { TimepointMinimap } from 'scenes/components/TimepointExplorer/TimepointMinimap';

interface TimepointExplorerProps {
  check: Check;
}

export function TimepointExplorer({ check }: TimepointExplorerProps) {
  const [timeRange] = useTimeRange();
  const { data: maxProbeDurationData, isLoading: maxProbeDurationIsLoading } = useMaxProbeDuration(timeRange, check);

  const timeRangeTo: UnixTimestamp = timeRange.to.toDate().valueOf();
  const initialTimeRangeToInView = timeshiftedTimepoint(timeRangeTo, check.frequency);

  const timepoints = useTimepoints({ timeRange, check });
  const { ref, handleViewModeChange, viewMode, ...rest } = useTimepointExplorerView(
    timepoints,
    initialTimeRangeToInView
  );
  // console.log(timepoints);

  const drillProps: TimepointExplorerChild = useMemo(() => {
    return {
      ...rest,
      viewMode,
      timepoints,
      timeRange,
      maxProbeDurationData,
      isLoading: maxProbeDurationIsLoading,
    };
  }, [rest, timeRange, timepoints, maxProbeDurationData, maxProbeDurationIsLoading, viewMode]);

  return (
    <Stack direction={`column`} gap={2}>
      <Stack direction="row" gap={2}>
        <RadioButtonGroup options={VIEW_OPTIONS} value={viewMode} onChange={handleViewModeChange} />
      </Stack>

      <Stack direction="column" gap={2}>
        <TimepointList {...drillProps} ref={ref} />
        <TimepointMinimap {...drillProps} />
      </Stack>
    </Stack>
  );
}
