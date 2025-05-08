import React, { useCallback } from 'react';
import { Stack } from '@grafana/ui';

import { MinimapSection, TimepointExplorerChild } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import { TimepointMiniMapSection } from 'scenes/components/TimepointExplorer/TimepointMinimapSection';

export const TimepointMinimap = ({
  handleTimeRangeToInViewChange,
  miniMapSections,
  ...rest
}: TimepointExplorerChild) => {
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
    <Stack gap={0}>
      {miniMapSections
        .map((section, index) => (
          <TimepointMiniMapSection
            key={index}
            maxProbeDurationData={rest.maxProbeDurationData}
            section={section}
            timepoints={rest.timepoints}
            handleSectionClick={handleSectionClick}
            viewMode={rest.viewMode}
            timepointDisplayCount={rest.timepointDisplayCount}
          />
        ))
        .reverse()}
    </Stack>
  );
};
