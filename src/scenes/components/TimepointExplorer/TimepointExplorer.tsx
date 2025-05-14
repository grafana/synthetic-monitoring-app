import React, { useCallback, useMemo, useState } from 'react';
import { useTimeRange } from '@grafana/scenes-react';
import { RadioButtonGroup, Stack } from '@grafana/ui';

import { Check } from 'types';
import { TIMEPOINT_EXPLORER_VIEW_OPTIONS } from 'scenes/components/TimepointExplorer/TimepointExplorer.constants';
import {
  useMaxProbeDuration,
  useTimepointExplorerView,
  useTimepoints,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.hooks';
import {
  SelectedTimepointState,
  Timepoint,
  TimepointExplorerChild,
  UnixTimestamp,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import { timeshiftedTimepoint } from 'scenes/components/TimepointExplorer/TimepointExplorer.utils';
import { TimepointList } from 'scenes/components/TimepointExplorer/TimepointList';
import { TimepointMinimap } from 'scenes/components/TimepointExplorer/TimepointMinimap';
import { TimepointViewer } from 'scenes/components/TimepointExplorer/TimepointViewer';

interface TimepointExplorerProps {
  check: Check;
}

export function TimepointExplorer({ check }: TimepointExplorerProps) {
  const [timeRange] = useTimeRange();
  const { data: maxProbeDurationData, isLoading: maxProbeDurationIsLoading } = useMaxProbeDuration(timeRange, check);
  const [selectedTimepoint, setSelectedTimepoint] = useState<SelectedTimepointState>([null, null]);

  const timeRangeTo: UnixTimestamp = timeRange.to.toDate().valueOf();
  const initialTimeRangeToInView = timeshiftedTimepoint(timeRangeTo, check.frequency);

  const timepoints = useTimepoints({ timeRange, check });
  const { ref, handleViewModeChange, viewMode, ...rest } = useTimepointExplorerView(
    timepoints,
    initialTimeRangeToInView
  );

  const handleTimepointSelection = useCallback((timepoint: Timepoint, probeToView: string) => {
    setSelectedTimepoint(([prevTimepoint, prevProbeToView]) => {
      return prevTimepoint?.adjustedTime === timepoint.adjustedTime && prevProbeToView === probeToView
        ? [null, null]
        : [timepoint, probeToView];
    });
  }, []);

  const timepointExplorerChildProps: TimepointExplorerChild = useMemo(() => {
    return {
      ...rest,
      viewMode,
      timepoints,
      timeRange,
      maxProbeDurationData,
      isLoading: maxProbeDurationIsLoading,
      selectedTimepoint,
      handleTimepointSelection,
      check,
    };
  }, [
    check,
    rest,
    timeRange,
    timepoints,
    maxProbeDurationData,
    maxProbeDurationIsLoading,
    viewMode,
    selectedTimepoint,
    handleTimepointSelection,
  ]);

  return (
    <Stack direction={`column`} gap={2}>
      <Stack direction="row" gap={2}>
        <RadioButtonGroup options={TIMEPOINT_EXPLORER_VIEW_OPTIONS} value={viewMode} onChange={handleViewModeChange} />
      </Stack>

      <Stack direction="column" gap={2}>
        <TimepointList {...timepointExplorerChildProps} ref={ref} />
        <TimepointMinimap {...timepointExplorerChildProps} />
        <TimepointViewer {...timepointExplorerChildProps} />
      </Stack>
    </Stack>
  );
}
