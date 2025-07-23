import React, { forwardRef, RefObject, useCallback, useEffect, useMemo, useState } from 'react';
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
} from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import {
  combineTimepointsWithLogs,
  constructCheckEvents,
  generateAnnotations,
  getMiniMapPages,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.utils';
import { TimepointList } from 'scenes/components/TimepointExplorer/TimepointList';
import { TimepointMinimap } from 'scenes/components/TimepointExplorer/TimepointMinimap';
import { TimepointViewer } from 'scenes/components/TimepointExplorer/TimepointViewer';

interface TimepointExplorerProps {
  check: Check;
}

export const TimepointExplorer = ({ check }: TimepointExplorerProps) => {
  const [timeRange] = useTimeRange();
  const [miniMapPage, setMiniMapPage] = useState(0);
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
  const timepointsDisplayCount = Math.floor(width / (TIMEPOINT_SIZE + TIMEPOINT_GAP_PX));
  const miniMapPages = useMemo(
    () => getMiniMapPages(timepoints, timepointsDisplayCount),
    [timepoints, timepointsDisplayCount]
  );

  // reset miniMapPage to 0 when miniMapPages changes (such as screen resize)
  useEffect(() => {
    if (miniMapPages.length > 0) {
      setMiniMapPage(0);
    }
  }, [miniMapPages]);

  const [miniMapStartingIndex, miniMapEndingIndex] = miniMapPages[miniMapPage] || [0, 0];
  const miniMapVisibleTimepoints = timepoints.slice(miniMapStartingIndex, miniMapEndingIndex);

  return (
    <TimepointExplorerInternal
      check={check}
      checkConfigs={checkConfigs}
      isLoading={isLoading}
      handleMiniMapPageChange={setMiniMapPage}
      maxProbeDuration={maxProbeDuration}
      miniMapPages={miniMapPages}
      miniMapPage={miniMapPage}
      miniMapVisibleTimepoints={miniMapVisibleTimepoints}
      timepointsDisplayCount={timepointsDisplayCount}
      width={width}
      ref={ref}
    />
  );
};

interface TimepointExplorerInternalProps {
  check: Check;
  checkConfigs: CheckConfig[];
  isLoading: boolean;
  handleMiniMapPageChange: React.Dispatch<React.SetStateAction<number>>;
  maxProbeDuration: number;
  miniMapPage: number;
  miniMapPages: Array<[number, number]>;
  miniMapVisibleTimepoints: Timepoint[];
  timepointsDisplayCount: number;
  width: number;
  ref: RefObject<HTMLDivElement | null>;
}

const TimepointExplorerInternal = forwardRef<HTMLDivElement, TimepointExplorerInternalProps>(
  (
    {
      check,
      checkConfigs,
      handleMiniMapPageChange,
      isLoading,
      maxProbeDuration,
      miniMapPage,
      miniMapPages,
      miniMapVisibleTimepoints,
      timepointsDisplayCount,
      width,
    },
    ref
  ) => {
    const [selectedTimepoint, setSelectedTimepoint] = useState<SelectedTimepointState>([null, null]);
    const timepointTo = miniMapVisibleTimepoints[miniMapVisibleTimepoints.length - 1];
    const timepointFrom = miniMapVisibleTimepoints[0];

    const timeRangeTo = timepointTo?.adjustedTime + timepointTo?.timepointDuration;
    const timeRangeFrom = timepointFrom?.adjustedTime;

    const timeRange = useMemo(() => {
      return {
        from: timeRangeFrom,
        to: timeRangeTo,
      };
    }, [timeRangeFrom, timeRangeTo]);

    const checkEvents = constructCheckEvents({
      timeRangeFrom,
      checkConfigs,
      checkCreation: check.created,
    });

    const { data: logsData = [] } = useExecutionEndingLogs({ timeRange, check });

    const timepoints = combineTimepointsWithLogs({
      timepoints: miniMapVisibleTimepoints,
      logs: logsData,
      timeRangeFrom,
      timeRangeTo,
    });
    const annotations = generateAnnotations({ checkEvents, timepoints });
    const { activeMiniMapSectionIndex, handleMiniMapSectionClick, handleViewModeChange, miniMapSections, viewMode } =
      useTimepointExplorerView(timepoints, timepointsDisplayCount);

    const handleMiniMapNavigationClick = useCallback(
      (page: number) => {
        handleMiniMapPageChange(page);
      },
      [handleMiniMapPageChange]
    );

    const handleTimepointSelection = useCallback((timepoint: Timepoint, probeToView: string) => {
      setSelectedTimepoint(([prevTimepoint, prevProbeToView]) => {
        return prevTimepoint?.adjustedTime === timepoint.adjustedTime && prevProbeToView === probeToView
          ? [null, null]
          : [timepoint, probeToView];
      });
    }, []);

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
          <TimepointMinimap
            miniMapPage={miniMapPage}
            miniMapPages={miniMapPages}
            handleMiniMapNavigationClick={handleMiniMapNavigationClick}
            activeMiniMapSectionIndex={activeMiniMapSectionIndex}
            annotations={annotations}
            handleMiniMapSectionClick={handleMiniMapSectionClick}
            miniMapSections={miniMapSections}
            maxProbeDuration={maxProbeDuration}
            timepoints={timepoints}
            viewMode={viewMode}
            timepointsDisplayCount={timepointsDisplayCount}
            selectedTimepoint={selectedTimepoint}
          />
          <TimepointList
            activeMiniMapSectionIndex={activeMiniMapSectionIndex}
            annotations={annotations}
            handleTimepointSelection={handleTimepointSelection}
            maxProbeDuration={maxProbeDuration}
            miniMapSections={miniMapSections}
            selectedTimepoint={selectedTimepoint}
            timepointsDisplayCount={timepointsDisplayCount}
            timepoints={timepoints}
            timeRange={timeRange}
            viewMode={viewMode}
            width={width}
            ref={ref}
          />
          <TimepointViewer
            check={check}
            handleTimepointSelection={handleTimepointSelection}
            selectedTimepoint={selectedTimepoint}
          />
        </Stack>
      </Stack>
    );
  }
);

TimepointExplorerInternal.displayName = 'TimepointExplorerInternal';
