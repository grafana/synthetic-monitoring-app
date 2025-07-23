import React, { useCallback, useRef } from 'react';
import { Box, IconButton, Pagination, Stack, Text } from '@grafana/ui';

import { formatDuration } from 'utils';
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
  maxProbeDuration: number;
  timepoints: Timepoint[];
  viewMode: ViewMode;
  timepointsDisplayCount: number;
  selectedTimepoint: SelectedTimepointState;
  miniMapPage: number;
  miniMapPages: Array<[number, number]>;
  handleMiniMapNavigationClick: (page: number) => void;
}

export const TimepointMinimap = ({
  annotations,
  activeMiniMapSectionIndex,
  handleMiniMapSectionClick,
  miniMapSections,
  maxProbeDuration,
  timepoints,
  viewMode,
  timepointsDisplayCount,
  selectedTimepoint,
  miniMapPage,
  miniMapPages,
  handleMiniMapNavigationClick,
}: TimepointMinimapProps) => {
  const ref = useRef<HTMLDivElement>(null);
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
            handleMiniMapNavigationClick(miniMapPage + 1);
          }}
        />
        <Stack direction="column" flex={1}>
          <Box ref={ref} flex={1}>
            <TimepointMinimapContent
              annotations={annotations}
              activeMiniMapSectionIndex={activeMiniMapSectionIndex}
              handleMiniMapSectionClick={handleMiniMapSectionClick}
              miniMapSections={miniMapSections}
              maxProbeDuration={maxProbeDuration}
              timepoints={timepoints}
              viewMode={viewMode}
              timepointsDisplayCount={timepointsDisplayCount}
              selectedTimepoint={selectedTimepoint}
              miniMapPage={miniMapPage}
              miniMapPages={miniMapPages}
              handleMiniMapNavigationClick={handleMiniMapNavigationClick}
            />
          </Box>
          <Stack direction="row" flex={1} justifyContent="space-between">
            <Text variant="body">
              {startingTimepoint?.adjustedTime ? new Date(startingTimepoint.adjustedTime).toLocaleString() : ''}
            </Text>
            <MiniMapPagination
              miniMapPage={miniMapPage}
              miniMapPages={miniMapPages}
              onNavigate={handleMiniMapNavigationClick}
            />
            <Text variant="body">
              {endingTimepoint?.adjustedTime ? new Date(endingTimepoint.adjustedTime).toLocaleString() : ''}
            </Text>
          </Stack>
        </Stack>
        <MiniMapNavigation
          direction="right"
          disabled={miniMapPage === 0}
          onClick={() => {
            handleMiniMapNavigationClick(miniMapPage - 1);
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
  maxProbeDuration,
  timepoints,
  viewMode,
  timepointsDisplayCount,
  selectedTimepoint,
}: TimepointMinimapProps) => {
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
  onNavigate: (page: number) => void;
}

const MiniMapPagination = ({ miniMapPage, miniMapPages, onNavigate }: MiniMapPaginationProps) => {
  const currentPage = miniMapPages.length - miniMapPage;
  const numberOfPages = miniMapPages.length;

  const handleNavigate = useCallback(
    (page: number) => {
      onNavigate(miniMapPages.length - page);
    },
    [onNavigate, miniMapPages.length]
  );

  return <Pagination currentPage={currentPage} numberOfPages={numberOfPages} onNavigate={handleNavigate} />;
};
