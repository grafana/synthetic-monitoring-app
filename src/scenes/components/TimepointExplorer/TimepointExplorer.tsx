import React, { useCallback, useMemo, useState } from 'react';
import { useTimeRange } from '@grafana/scenes-react';
import { RadioButtonGroup, Stack } from '@grafana/ui';

import { Check } from 'types';
import { TIMEPOINT_EXPLORER_VIEW_OPTIONS } from 'scenes/components/TimepointExplorer/TimepointExplorer.constants';
import {
  useCheckConfigs,
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
import {
  constructCheckEvents,
  generateAnnotations,
  timeshiftedTimepoint,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.utils';
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
  const { data: checkConfigs = [] } = useCheckConfigs({ timeRange, check });
  const checkEvents = constructCheckEvents({
    timeRangeFrom: timeRange.from.toDate().valueOf(),
    checkConfigs,
    checkCreation: check.created,
  });

  const timeRangeTo: UnixTimestamp = timeRange.to.toDate().valueOf();
  const initialTimeRangeToInView = timeshiftedTimepoint(timeRangeTo, check.frequency);

  const timepoints = useTimepoints({ timeRange, check });
  const annotations = generateAnnotations({ checkEvents, timepoints });
  const {
    activeSection,
    handleTimeRangeToInViewChange,
    handleViewModeChange,
    miniMapSections,
    ref,
    timepointDisplayCount,
    viewMode,
    viewTimeRangeTo,
    width,
  } = useTimepointExplorerView(timepoints, initialTimeRangeToInView);

  const handleTimepointSelection = useCallback((timepoint: Timepoint, probeToView: string) => {
    setSelectedTimepoint(([prevTimepoint, prevProbeToView]) => {
      return prevTimepoint?.adjustedTime === timepoint.adjustedTime && prevProbeToView === probeToView
        ? [null, null]
        : [timepoint, probeToView];
    });
  }, []);

  const timepointExplorerChildProps: TimepointExplorerChild = useMemo(() => {
    return {
      activeSection,
      annotations,
      check,
      handleTimepointSelection,
      handleTimeRangeToInViewChange,
      isLoading: maxProbeDurationIsLoading,
      maxProbeDurationData,
      miniMapSections,
      selectedTimepoint,
      timepointDisplayCount,
      timepoints,
      timeRange,
      viewMode,
      viewTimeRangeTo,
      width,
    };
  }, [
    activeSection,
    annotations,
    check,
    handleTimepointSelection,
    handleTimeRangeToInViewChange,
    maxProbeDurationData,
    maxProbeDurationIsLoading,
    miniMapSections,
    selectedTimepoint,
    timepointDisplayCount,
    timepoints,
    timeRange,
    viewMode,
    viewTimeRangeTo,
    width,
  ]);

  return (
    <Stack direction={`column`} gap={2}>
      <Stack direction="row" gap={2}>
        <RadioButtonGroup options={TIMEPOINT_EXPLORER_VIEW_OPTIONS} value={viewMode} onChange={handleViewModeChange} />
      </Stack>

      <Stack direction="column" gap={2}>
        <TimepointMinimap {...timepointExplorerChildProps} />
        <TimepointList {...timepointExplorerChildProps} ref={ref} />
        <TimepointViewer {...timepointExplorerChildProps} />
      </Stack>
    </Stack>
  );
}
