import React from 'react';
import { RadioButtonGroup, Stack } from '@grafana/ui';

import { Check } from 'types';
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
  const { viewMode, handleViewModeChange } = useTimepointExplorerContext();

  return (
    <Stack direction={`column`} gap={2}>
      <Stack direction="row" gap={2}>
        <RadioButtonGroup options={TIMEPOINT_EXPLORER_VIEW_OPTIONS} value={viewMode} onChange={handleViewModeChange} />
      </Stack>

      <Stack direction="column" gap={2}>
        <TimepointMinimap />
        <TimepointList />
        <TimepointViewer />
      </Stack>
    </Stack>
  );
};
