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

  if (!vizDisplay.includes(status)) {
    return <div />;
  }

  return (
    <TimepointListEntryBar timepoint={timepoint} status={status}>
      {status === 'failure' ? <Icon name={`times`} /> : status === 'success' ? <Icon name={`check`} /> : `?`}
    </TimepointListEntryBar>
  );
};
