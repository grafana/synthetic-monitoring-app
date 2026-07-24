import React from 'react';
import { Text } from '@grafana/ui';

import { formatDuration } from 'utils';
import { useVisibleTimepoints } from 'scenes/components/TimepointExplorer/TimepointExplorer.hooks';
import { getVisibleTimepointsTimeRange } from 'scenes/components/TimepointExplorer/TimepointExplorer.utils';

interface TimepointExplorerVisibleOverviewProps {
  overviewExtra?: string;
}

export const TimepointExplorerVisibleOverview = ({ overviewExtra }: TimepointExplorerVisibleOverviewProps) => {
  const visibleTimepoints = useVisibleTimepoints();
  const { from, to } = getVisibleTimepointsTimeRange({ timepoints: visibleTimepoints });
  const lengthOfTime = to - from;

  if (Number.isNaN(lengthOfTime)) {
    return <div />;
  }

  const overview = overviewExtra
    ? `${formatDuration(lengthOfTime)} overview · ${overviewExtra}`
    : `${formatDuration(lengthOfTime)} overview`;

  return <Text variant="body">{overview}</Text>;
};
