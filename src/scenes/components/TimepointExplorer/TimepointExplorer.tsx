import React, { forwardRef, RefObject, useCallback, useMemo, useState } from 'react';
import { TimeRange } from '@grafana/data';
import { useTimeRange } from '@grafana/scenes-react';
import { RadioButtonGroup, Stack } from '@grafana/ui';

import { Check } from 'types';
import {
  MAX_PROBE_DURATION_DEFAULT,
  TIMEPOINT_EXPLORER_VIEW_OPTIONS,
  TIMEPOINT_GAP_PX,
  TIMEPOINT_SIZE,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.constants';
import {
  useExecutionEndingLogs,
  useExplorerWidth,
  usePersistedCheckConfigs,
  usePersistedMaxProbeDuration,
  useTimepointExplorerView,
  useTimepoints,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.hooks';
import {
  CheckConfig,
  SelectedTimepointState,
  Timepoint,
  TimepointExplorerChild,
  UnixTimestamp,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import {
  combineTimepointsWithLogs,
  constructCheckEvents,
  generateAnnotations,
  getVisibleTimepointsFromLocalTimeRange,
  timeshiftedTimepoint,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.utils';
import { TimepointList } from 'scenes/components/TimepointExplorer/TimepointList';
import { TimepointMinimap } from 'scenes/components/TimepointExplorer/TimepointMinimap';
import { TimepointViewer } from 'scenes/components/TimepointExplorer/TimepointViewer';

interface TimepointExplorerProps {
  check: Check;
}

export const TimepointExplorer = ({ check }: TimepointExplorerProps) => {
  const [timeRange] = useTimeRange();
  const { data: maxProbeDurationData, isLoading: maxProbeDurationIsLoading } = usePersistedMaxProbeDuration({
    timeRange,
    check,
  });

  const INITIAL_CHECK_CONFIG: CheckConfig = {
    frequency: check.frequency,
    date: Number(check.created),
  };

  const maxProbeDuration =
    maxProbeDurationData < MAX_PROBE_DURATION_DEFAULT ? MAX_PROBE_DURATION_DEFAULT : maxProbeDurationData;
  const { data: checkConfigs = [INITIAL_CHECK_CONFIG], isLoading: checkConfigsIsLoading } = usePersistedCheckConfigs({
    timeRange,
    check,
  });
  const timepoints = useTimepoints({ timeRange, checkConfigs });
  const isLoading = maxProbeDurationIsLoading || checkConfigsIsLoading;
  const { width, ref } = useExplorerWidth();
  const timepointsToDisplay = Math.floor(width / (TIMEPOINT_SIZE + TIMEPOINT_GAP_PX));

  return (
    <TimepointExplorerInternal
      check={check}
      checkConfigs={checkConfigs}
      isLoading={isLoading}
      maxProbeDuration={maxProbeDuration}
      timeRange={timeRange}
      timepoints={timepoints}
      timepointsToDisplay={timepointsToDisplay}
      width={width}
      ref={ref}
    />
  );
};

interface TimepointExplorerInternalProps {
  check: Check;
  checkConfigs: CheckConfig[];
  isLoading: boolean;
  maxProbeDuration: number;
  timeRange: TimeRange;
  timepoints: Timepoint[];
  timepointsToDisplay: number;
  width: number;
  ref: RefObject<HTMLDivElement | null>;
}

const TimepointExplorerInternal = forwardRef<HTMLDivElement, TimepointExplorerInternalProps>(
  (
    {
      check,
      checkConfigs,
      maxProbeDuration,
      isLoading,
      timeRange,
      timepoints: loglessTimepoints,
      timepointsToDisplay,
      width,
    },
    ref
  ) => {
    const [selectedTimepoint, setSelectedTimepoint] = useState<SelectedTimepointState>([null, null]);
    const localTimeRangeTo = timeshiftedTimepoint(timeRange.to.toDate().valueOf(), check.frequency);

    const visibleTimepoints = getVisibleTimepointsFromLocalTimeRange({
      timepoints: loglessTimepoints,
      timepointsToDisplay,
      to: localTimeRangeTo,
    });

    const selectedTimeRange = useMemo(() => {
      return {
        from: visibleTimepoints[0]?.adjustedTime,
        to: visibleTimepoints[visibleTimepoints.length - 1]?.adjustedTime,
      };
    }, [visibleTimepoints]);

    const timeRangeTo: UnixTimestamp = selectedTimeRange.to;
    const timeRangeFrom: UnixTimestamp = selectedTimeRange.from;

    const checkEvents = constructCheckEvents({
      timeRangeFrom,
      checkConfigs,
      checkCreation: check.created,
    });

    const { data: logsData = [] } = useExecutionEndingLogs({ timeRange: selectedTimeRange, check });

    const timepoints = combineTimepointsWithLogs({
      timepoints: visibleTimepoints,
      logs: logsData,
      timeRangeFrom,
      timeRangeTo,
    });
    const annotations = generateAnnotations({ checkEvents, timepoints });
    const { activeMiniMapSectionIndex, handleMiniMapSectionClick, handleViewModeChange, miniMapSections, viewMode } =
      useTimepointExplorerView(timepoints, timepointsToDisplay);

    const handleTimepointSelection = useCallback((timepoint: Timepoint, probeToView: string) => {
      setSelectedTimepoint(([prevTimepoint, prevProbeToView]) => {
        return prevTimepoint?.adjustedTime === timepoint.adjustedTime && prevProbeToView === probeToView
          ? [null, null]
          : [timepoint, probeToView];
      });
    }, []);

    const timepointExplorerChildProps: TimepointExplorerChild = useMemo(() => {
      return {
        activeMiniMapSectionIndex,
        annotations,
        check,
        handleMiniMapSectionClick,
        handleTimepointSelection,
        isLoading,
        maxProbeDuration,
        miniMapSections,
        selectedTimepoint,
        timepointsToDisplay,
        timepoints,
        timeRange: selectedTimeRange,
        viewMode,
        width,
      };
    }, [
      activeMiniMapSectionIndex,
      annotations,
      check,
      handleMiniMapSectionClick,
      handleTimepointSelection,
      isLoading,
      maxProbeDuration,
      miniMapSections,
      selectedTimepoint,
      selectedTimeRange,
      timepoints,
      timepointsToDisplay,
      viewMode,
      width,
    ]);

    return (
      <Stack direction={`column`} gap={2}>
        <Stack direction="row" gap={2}>
          <RadioButtonGroup
            options={TIMEPOINT_EXPLORER_VIEW_OPTIONS}
            value={viewMode}
            onChange={handleViewModeChange}
          />
        </Stack>

        <Stack direction="column" gap={2}>
          <TimepointMinimap {...timepointExplorerChildProps} />
          <TimepointList {...timepointExplorerChildProps} ref={ref} />
          <TimepointViewer {...timepointExplorerChildProps} />
        </Stack>
      </Stack>
    );
  }
);

TimepointExplorerInternal.displayName = 'TimepointExplorerInternal';
