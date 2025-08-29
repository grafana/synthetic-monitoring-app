import React from 'react';
import { Icon } from '@grafana/ui';

import { useTimepointExplorerContext } from 'scenes/components/TimepointExplorer/TimepointExplorer.context';
import { useStatefulTimepoint } from 'scenes/components/TimepointExplorer/TimepointExplorer.hooks';
import { StatelessTimepoint } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import { TimepointListEntryBar } from 'scenes/components/TimepointExplorer/TimepointListEntryBar';

interface TimepointListEntryProps {
  timepoint: StatelessTimepoint;
}

export const TimepointListEntryUptime = ({ timepoint }: TimepointListEntryProps) => {
  const { status } = useStatefulTimepoint(timepoint);
  const { vizDisplay } = useTimepointExplorerContext();
  const isSuccess = status === 'success';
  const isFailure = status === 'failure';

  if (!vizDisplay.includes(status)) {
    return <div />;
  }

  return (
    <TimepointListEntryBar analyticsEventName={`uptime-entry`} timepoint={timepoint} status={status}>
      {isFailure ? <Icon name={`times`} key={`times`} /> : isSuccess ? <Icon name={`check`} key={`check`} /> : `?`}
    </TimepointListEntryBar>
  );
};
