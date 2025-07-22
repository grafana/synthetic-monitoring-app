import React, { forwardRef, useCallback, useMemo, useState } from 'react';
import { TimeRange } from '@grafana/data';
import { useTimeRange } from '@grafana/scenes-react';
import { RadioButtonGroup, Stack } from '@grafana/ui';

import { Check } from 'types';
import {
  MAX_PROBE_DURATION_DEFAULT,
  TIMEPOINT_EXPLORER_VIEW_OPTIONS,
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
  const maxProbeDuration =
    maxProbeDurationData < MAX_PROBE_DURATION_DEFAULT ? MAX_PROBE_DURATION_DEFAULT : maxProbeDurationData;
  const { data: checkConfigs = [], isLoading: checkConfigsIsLoading } = usePersistedCheckConfigs({ timeRange, check });
  const timepointsInGlobalRange = useTimepoints({ timeRange, checkConfigs });
  const isLoading = maxProbeDurationIsLoading || checkConfigsIsLoading;
  const { width, ref } = useExplorerWidth();

  return (
    <TimepointExplorerInternal
      check={check}
      checkConfigs={checkConfigs}
      isLoading={isLoading}
      maxProbeDuration={maxProbeDuration}
      timeRange={timeRange}
      timepoints={timepointsInGlobalRange}
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
  width: number;
  ref: React.RefObject<HTMLDivElement | null>;
}

const TimepointExplorerInternal = forwardRef<HTMLDivElement, TimepointExplorerInternalProps>(
  ({ check, checkConfigs, maxProbeDuration, isLoading, timeRange, timepoints: loglessTimepoints, width }, ref) => {
    const [selectedTimepoint, setSelectedTimepoint] = useState<SelectedTimepointState>([null, null]);

    const checkEvents = constructCheckEvents({
      timeRangeFrom: timeRange.from.toDate().valueOf(),
      checkConfigs,
      checkCreation: check.created,
    });

    const timeRangeTo: UnixTimestamp = timeRange.to.toDate().valueOf();
    const initialTimeRangeToInView = timeshiftedTimepoint(timeRangeTo, check.frequency);

    const { data: logsData = [] } = useExecutionEndingLogs({ timeRange, check });
    const timepoints = combineTimepointsWithLogs({
      timepoints: loglessTimepoints,
      logs: logsData,
      timeRangeFrom: timeRange.from.toDate().valueOf(),
      timeRangeTo,
    });
    const annotations = generateAnnotations({ checkEvents, timepoints });
    const {
      activeSection,
      handleTimeRangeToInViewChange,
      handleViewModeChange,
      miniMapSections,
      timepointDisplayCount,
      viewMode,
      viewTimeRangeTo,
    } = useTimepointExplorerView(timepoints, initialTimeRangeToInView, width);

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
        isLoading,
        maxProbeDuration,
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
      isLoading,
      maxProbeDuration,
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
