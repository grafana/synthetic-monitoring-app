import React, { useCallback } from 'react';
import { Box, IconButton, Pagination, Stack, Text } from '@grafana/ui';

import { formatDuration } from 'utils';
import { useTimepointExplorerContext } from 'scenes/components/TimepointExplorer/TimepointExplorer.context';
import {
  Annotation,
  MinimapSection,
  SelectedTimepointState,
  Timepoint,
  ViewMode,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import { TimepointMiniMapSection } from 'scenes/components/TimepointExplorer/TimepointMinimapSection';

interface TimepointMinimapProps {
  annotations: Annotation[];
  activeMiniMapSectionIndex: number;
  handleMiniMapSectionClick: (index: number) => void;
  miniMapSections: MinimapSection[];
  timepoints: Timepoint[];
  viewMode: ViewMode;
  selectedTimepoint: SelectedTimepointState;
}

export const TimepointMinimap = ({
  annotations,
  activeMiniMapSectionIndex,
  handleMiniMapSectionClick,
  miniMapSections,
  timepoints,
  viewMode,
  selectedTimepoint,
}: TimepointMinimapProps) => {
  const { handleMiniMapPageChange, miniMapPage, miniMapPages } = useTimepointExplorerContext();
  const endingTimepoint = timepoints[0] || null;
  const startingTimepoint = timepoints[timepoints.length - 1] || null;
  const lengthOfTime = endingTimepoint?.adjustedTime - startingTimepoint?.adjustedTime;

  return (
    <Stack direction="column" gap={2}>
      <Text variant="body">{lengthOfTime ? formatDuration(lengthOfTime) : ''} overview</Text>
      <Stack gap={2}>
        <MiniMapNavigation
          disabled={miniMapPage === miniMapPages.length - 1}
          direction="left"
          onClick={() => {
            handleMiniMapPageChange(miniMapPage + 1);
          }}
        />
        <Stack direction="column" flex={1}>
          <Box flex={1}>
            <TimepointMinimapContent
              annotations={annotations}
              activeMiniMapSectionIndex={activeMiniMapSectionIndex}
              handleMiniMapSectionClick={handleMiniMapSectionClick}
              miniMapSections={miniMapSections}
              timepoints={timepoints}
              viewMode={viewMode}
              selectedTimepoint={selectedTimepoint}
            />
          </Box>
          <Stack direction="row" flex={1} justifyContent="space-between">
            <Text variant="body">
              {startingTimepoint?.adjustedTime ? new Date(startingTimepoint.adjustedTime).toLocaleString() : ''}
            </Text>
            <MiniMapPagination miniMapPage={miniMapPage} miniMapPages={miniMapPages} />
            <Text variant="body">
              {endingTimepoint?.adjustedTime ? new Date(endingTimepoint.adjustedTime).toLocaleString() : ''}
            </Text>
          </Stack>
        </Stack>
        <MiniMapNavigation
          direction="right"
          disabled={miniMapPage === 0}
          onClick={() => {
            handleMiniMapPageChange(miniMapPage - 1);
          }}
        />
      </Stack>
    </Stack>
  );
};

const TimepointMinimapContent = ({
  annotations,
  activeMiniMapSectionIndex,
  handleMiniMapSectionClick,
  miniMapSections,
  timepoints,
  viewMode,
  selectedTimepoint,
}: TimepointMinimapProps) => {
  const { maxProbeDuration, timepointsDisplayCount } = useTimepointExplorerContext();
  // todo: fix this
  if (miniMapSections.length === 0) {
    return null;
  }

  return (
    <Box position="relative" paddingY={2}>
      <Stack gap={0}>
        {miniMapSections
          .map((section, index) => (
            <TimepointMiniMapSection
              activeMiniMapSectionIndex={activeMiniMapSectionIndex}
              annotations={annotations}
              index={index}
              key={index}
              maxProbeDuration={maxProbeDuration}
              section={section}
              timepoints={timepoints}
              handleSectionClick={handleMiniMapSectionClick}
              viewMode={viewMode}
              timepointsDisplayCount={timepointsDisplayCount}
              selectedTimepoint={selectedTimepoint}
            />
          ))
          .reverse()}
      </Stack>
    </Box>
  );
};

interface MiniMapNavigationProps {
  direction: 'left' | 'right';
  disabled: boolean;
  onClick: () => void;
}

const MiniMapNavigation = ({ direction, disabled, onClick }: MiniMapNavigationProps) => {
  const iconName = direction === 'left' ? 'angle-left' : 'angle-right';

  return <IconButton name={iconName} tooltip={`${direction} arrow`} onClick={onClick} disabled={disabled} />;
};

interface MiniMapPaginationProps {
  miniMapPage: number;
  miniMapPages: Array<[number, number]>;
}

const MiniMapPagination = ({ miniMapPage, miniMapPages }: MiniMapPaginationProps) => {
  const { handleMiniMapPageChange } = useTimepointExplorerContext();
  const currentPage = miniMapPages.length - miniMapPage;
  const numberOfPages = miniMapPages.length;

  const handleNavigate = useCallback(
    (page: number) => {
      handleMiniMapPageChange(miniMapPages.length - page);
    },
    [handleMiniMapPageChange, miniMapPages.length]
  );

  return <Pagination currentPage={currentPage} numberOfPages={numberOfPages} onNavigate={handleNavigate} />;
};
