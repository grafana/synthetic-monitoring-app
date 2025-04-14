import React from 'react';
import { useTimeRange } from '@grafana/scenes-react';
import { Stack } from '@grafana/ui';

import { Check } from 'types';
import { TimepointList } from 'scenes/components/TimepointExplorer/TimepointList';
import { TimepointMinimap } from 'scenes/components/TimepointExplorer/TimepointMinimap';
import { useTimepointExplorer } from 'scenes/components/TimepointExplorer/useTimepointExplorer';

interface TimepointExplorerProps {
  check: Check;
}

export function TimepointExplorer({ check }: TimepointExplorerProps) {
  const [timeRange] = useTimeRange();
  const { timepointsInRange } = useTimepointExplorer({ timeRange, check });

  return (
    <Stack direction="column" gap={2}>
      <TimepointList timeRange={timeRange} />
      <TimepointMinimap timeRange={timeRange} />
    </Stack>
  );
}
