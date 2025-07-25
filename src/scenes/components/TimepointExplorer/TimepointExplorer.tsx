import React from 'react';
import { Icon, RadioButtonGroup, Stack } from '@grafana/ui';

import { Check } from 'types';
import { PlainButton } from 'components/PlainButton';
import { TIMEPOINT_EXPLORER_VIEW_OPTIONS } from 'scenes/components/TimepointExplorer/TimepointExplorer.constants';
import {
  TimepointExplorerProvider,
  useTimepointExplorerContext,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.context';
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
  const {
    miniMapCurrentPageTimeRange,
    viewMode,
    handleViewModeChange,
    handleTimepointWidthChange,
    timepointWidth,
    miniMapCurrentPageSections,
    miniMapCurrentSectionIndex,
  } = useTimepointExplorerContext();

  return (
    <Stack direction={`column`} gap={2}>
      <Stack direction="row" gap={2}>
        <RadioButtonGroup options={TIMEPOINT_EXPLORER_VIEW_OPTIONS} value={viewMode} onChange={handleViewModeChange} />
      </Stack>

      <Stack direction="column" gap={2}>
        <TimepointMinimap />
        <TimepointList timeRange={miniMapCurrentPageTimeRange} />
        <PlainButton
          onClick={() =>
            handleTimepointWidthChange(timepointWidth + 5, miniMapCurrentPageSections[miniMapCurrentSectionIndex])
          }
        >
          <Icon name="plus" />
        </PlainButton>
        <PlainButton
          onClick={() =>
            handleTimepointWidthChange(timepointWidth - 5, miniMapCurrentPageSections[miniMapCurrentSectionIndex])
          }
        >
          <Icon name="minus" />
        </PlainButton>
        <TimepointViewer />
      </Stack>
    </Stack>
  );
};
