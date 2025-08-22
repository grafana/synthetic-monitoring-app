import React from 'react';

import { ChunkyLoadingBar } from 'components/ChunkyLoadingBar/ChunkyLoadingBar';
import { TIMEPOINT_THEME_HEIGHT_PX } from 'scenes/components/TimepointExplorer/TimepointExplorer.constants';
import { useTimepointExplorerContext } from 'scenes/components/TimepointExplorer/TimepointExplorer.context';
import { useStatefulTimepoint } from 'scenes/components/TimepointExplorer/TimepointExplorer.hooks';
import { StatelessTimepoint } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import { getEntryHeightPx } from 'scenes/components/TimepointExplorer/TimepointExplorer.utils';
import { TimepointListEntryBar } from 'scenes/components/TimepointExplorer/TimepointListEntryBar';

interface TimepointListEntryPendingProps {
  timepoint: StatelessTimepoint;
}

export const TimepointListEntryPending = ({ timepoint }: TimepointListEntryPendingProps) => {
  const statefulTimepoint = useStatefulTimepoint(timepoint);
  const { yAxisMax, timepointWidth, vizOptions } = useTimepointExplorerContext();
  const option = vizOptions.pending;
  const heightInPx = getEntryHeightPx(statefulTimepoint.maxProbeDuration, yAxisMax, TIMEPOINT_THEME_HEIGHT_PX);

  return (
    <TimepointListEntryBar timepoint={timepoint} status={`pending`}>
      <ChunkyLoadingBar color={option} direction="vertical" height={heightInPx} width={timepointWidth} />
    </TimepointListEntryBar>
  );
};
