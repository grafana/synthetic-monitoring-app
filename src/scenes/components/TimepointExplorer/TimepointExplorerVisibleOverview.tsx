import React from 'react';
import { Text } from '@grafana/ui';

import { formatDuration } from 'utils';
import { useVisibleTimepoints } from 'scenes/components/TimepointExplorer/TimepointExplorer.hooks';
import { getVisibleTimepointsTimeRange } from 'scenes/components/TimepointExplorer/TimepointExplorer.utils';

export const TimepointExplorerVisibleOverview = () => {
  const visibleTimepoints = useVisibleTimepoints();
  const { from, to } = getVisibleTimepointsTimeRange({ timepoints: visibleTimepoints });
  const lengthOfTime = to - from;

  return <Text variant="body">{lengthOfTime ? formatDuration(lengthOfTime) : ''} overview</Text>;
};
