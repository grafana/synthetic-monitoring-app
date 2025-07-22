import React, { useRef } from 'react';
import { Box, Stack } from '@grafana/ui';

import { TimepointExplorerChild } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import { TimepointMiniMapSection } from 'scenes/components/TimepointExplorer/TimepointMinimapSection';

export const TimepointMinimap = (props: TimepointExplorerChild) => {
  const ref = useRef<HTMLDivElement>(null);
  const width = ref.current?.clientWidth || 0;
  const sectionWidth = width / props.miniMapSections.length;

  return (
    <div ref={ref}>
      <TimepointMinimapContent {...props} sectionWidth={sectionWidth} />
    </div>
  );
};

const TimepointMinimapContent = ({
  annotations,
  activeMiniMapSectionIndex,
  handleMiniMapSectionClick,
  miniMapSections,
  sectionWidth,
  ...rest
}: TimepointExplorerChild & { sectionWidth: number }) => {
  // todo: fix this
  if (miniMapSections.length === 0) {
    return null;
  }

  return (
    <Box position="relative">
      <Stack gap={0}>
        {miniMapSections
          .map((section, index) => (
            <TimepointMiniMapSection
              activeMiniMapSectionIndex={activeMiniMapSectionIndex}
              annotations={annotations}
              index={index}
              key={index}
              maxProbeDuration={rest.maxProbeDuration}
              section={section}
              timepoints={rest.timepoints}
              handleSectionClick={handleMiniMapSectionClick}
              viewMode={rest.viewMode}
              timepointsToDisplay={rest.timepointsToDisplay}
              selectedTimepoint={rest.selectedTimepoint}
              sectionWidth={sectionWidth}
            />
          ))
          .reverse()}
      </Stack>
    </Box>
  );
};
