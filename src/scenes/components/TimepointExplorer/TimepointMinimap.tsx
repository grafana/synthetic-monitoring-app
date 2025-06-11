import React, { useCallback, useRef } from 'react';
import { Box, Stack } from '@grafana/ui';

import { MinimapSection, TimepointExplorerChild } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
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
  handleTimeRangeToInViewChange,
  miniMapSections,
  sectionWidth,
  annotations,
  ...rest
}: TimepointExplorerChild & { sectionWidth: number }) => {
  const handleSectionClick = useCallback(
    (section: MinimapSection) => {
      const newTimeRangeToInView = section.to;
      handleTimeRangeToInViewChange(newTimeRangeToInView);
    },
    [handleTimeRangeToInViewChange]
  );

  // todo: fix this
  if (miniMapSections.length === 0) {
    return null;
  }

  return (
    <Box position="relative">
      <Stack gap={0}>
        {miniMapSections.reverse().map((section, index) => (
          <TimepointMiniMapSection
            annotations={annotations}
            key={index}
            maxProbeDurationData={rest.maxProbeDurationData}
            section={section}
            timepoints={rest.timepoints}
            handleSectionClick={handleSectionClick}
            viewMode={rest.viewMode}
            timepointDisplayCount={rest.timepointDisplayCount}
            selectedTimepoint={rest.selectedTimepoint}
            sectionWidth={sectionWidth}
          />
        ))}
      </Stack>
    </Box>
  );
};
