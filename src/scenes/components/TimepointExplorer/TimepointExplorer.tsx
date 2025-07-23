import React, { useCallback, useState } from 'react';
import { RadioButtonGroup, Stack } from '@grafana/ui';

import { Check } from 'types';
import { TIMEPOINT_EXPLORER_VIEW_OPTIONS } from 'scenes/components/TimepointExplorer/TimepointExplorer.constants';
import {
  TimepointExplorerProvider,
  useTimepointExplorerContext,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.context';
import { useTimepointExplorerView } from 'scenes/components/TimepointExplorer/TimepointExplorer.hooks';
import { SelectedTimepointState, Timepoint } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import { constructCheckEvents, generateAnnotations } from 'scenes/components/TimepointExplorer/TimepointExplorer.utils';
import { TimepointList } from 'scenes/components/TimepointExplorer/TimepointList';
import { TimepointMinimap } from 'scenes/components/TimepointExplorer/TimepointMinimap';
import { TimepointViewer } from 'scenes/components/TimepointExplorer/TimepointViewer';

interface TimepointExplorerProps {
  check: Check;
}

export const TimepointExplorer = ({ check }: TimepointExplorerProps) => {
  return (
    <TimepointExplorerProvider check={check}>
      <TimepointExplorerInternal />
    </TimepointExplorerProvider>
  );
};

const TimepointExplorerInternal = () => {
  const { check, checkConfigs, miniMapCurrentPageTimeRange, timepoints, timepointsDisplayCount } =
    useTimepointExplorerContext();
  const [selectedTimepoint, setSelectedTimepoint] = useState<SelectedTimepointState>([null, null]);

  const checkEvents = constructCheckEvents({
    timeRangeFrom: miniMapCurrentPageTimeRange.from,
    checkConfigs,
    checkCreation: check.created,
  });

  const annotations = generateAnnotations({ checkEvents, timepoints });
  const { activeMiniMapSectionIndex, handleMiniMapSectionClick, handleViewModeChange, miniMapSections, viewMode } =
    useTimepointExplorerView(timepoints, timepointsDisplayCount);

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
        <RadioButtonGroup options={TIMEPOINT_EXPLORER_VIEW_OPTIONS} value={viewMode} onChange={handleViewModeChange} />
      </Stack>

      <Stack direction="column" gap={2}>
        <TimepointMinimap
          activeMiniMapSectionIndex={activeMiniMapSectionIndex}
          annotations={annotations}
          handleMiniMapSectionClick={handleMiniMapSectionClick}
          miniMapSections={miniMapSections}
          viewMode={viewMode}
          selectedTimepoint={selectedTimepoint}
        />
        <TimepointList
          activeMiniMapSectionIndex={activeMiniMapSectionIndex}
          annotations={annotations}
          handleTimepointSelection={handleTimepointSelection}
          miniMapSections={miniMapSections}
          selectedTimepoint={selectedTimepoint}
          timeRange={miniMapCurrentPageTimeRange}
          viewMode={viewMode}
        />
        <TimepointViewer handleTimepointSelection={handleTimepointSelection} selectedTimepoint={selectedTimepoint} />
      </Stack>
    </Stack>
  );
};
