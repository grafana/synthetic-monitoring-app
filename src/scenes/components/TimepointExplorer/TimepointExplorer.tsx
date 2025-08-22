import React from 'react';
import { Box, RadioButtonGroup, Stack, Text } from '@grafana/ui';

import { Check } from 'types';
import { TIMEPOINT_EXPLORER_VIEW_OPTIONS } from 'scenes/components/TimepointExplorer/TimepointExplorer.constants';
import {
  TimepointExplorerProvider,
  useTimepointExplorerContext,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.context';
import { TimepointExplorerVisibleOverview } from 'scenes/components/TimepointExplorer/TimepointExplorerVisibleOverview';
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
    <Box paddingTop={4}>
      <Stack direction={`column`} gap={2}>
        <Text element={`h2`}>Timepoint Explorer</Text>
        <Stack direction="row" gap={2} justifyContent={`space-between`} alignItems={`center`}>
          <TimepointExplorerVisibleOverview />
          <div>
            <RadioButtonGroup
              options={TIMEPOINT_EXPLORER_VIEW_OPTIONS}
              value={viewMode}
              onChange={handleViewModeChange}
            />
          </div>
        </Stack>

        <Stack direction="column" gap={2}>
          <TimepointMinimap />
          <TimepointList />
          <TimepointViewer />
        </Stack>
      </Stack>
    </Box>
  );
};
