import React from 'react';
import { Stack } from '@grafana/ui';

import { TIMEPOINT_GAP } from 'scenes/components/TimepointExplorer/TimepointExplorer.constants';
import { TimepointExplorerChild } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import { TimepointListEntry } from 'scenes/components/TimepointExplorer/TimepointListEntry';

export const TimepointList = ({ miniMapSections, timepoints }: TimepointExplorerChild) => {
  const activeSection = miniMapSections.find((section) => section.active);

  if (!activeSection) {
    return null;
  }

  const timepointsInRange = Object.values(timepoints).slice(activeSection.fromIndex, activeSection.toIndex);

  return (
    <Stack direction="row" gap={TIMEPOINT_GAP} alignItems={`end`} height={60} justifyContent={`end`}>
      {timepointsInRange.reverse().map((timepoint, index) => (
        <TimepointListEntry key={index} timepoint={timepoint} />
      ))}
    </Stack>
  );
};
