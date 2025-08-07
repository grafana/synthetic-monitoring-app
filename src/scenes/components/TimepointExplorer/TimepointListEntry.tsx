import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { TIMEPOINT_GAP_PX } from 'scenes/components/TimepointExplorer/TimepointExplorer.constants';
import { useTimepointExplorerContext } from 'scenes/components/TimepointExplorer/TimepointExplorer.context';
import { StatelessTimepoint } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import { TimepointListEntryPending } from 'scenes/components/TimepointExplorer/TimepointListEntryPending';
import { TimepointListEntryReachability } from 'scenes/components/TimepointExplorer/TimepointListEntryReachability';
import { TimepointListEntryUptime } from 'scenes/components/TimepointExplorer/TimepointListEntryUptime';

interface TimepointListEntryProps {
  timepoint: StatelessTimepoint;
  viewIndex: number;
}

export const TimepointListEntry = ({ timepoint, viewIndex }: TimepointListEntryProps) => {
  const { timepointWidth } = useTimepointExplorerContext();
  const styles = useStyles2(getStyles, timepointWidth);

  return (
    <div className={styles.timepoint} data-testid={`timepoint-${timepoint.adjustedTime}`}>
      <Entry timepoint={timepoint} viewIndex={viewIndex} />
    </div>
  );
};

const Entry = (props: TimepointListEntryProps) => {
  const { viewMode, isResultPending, timepoints } = useTimepointExplorerContext();
  const isPendingEntry = timepoints.length - 1 === props.timepoint.index;

  if (isResultPending && isPendingEntry) {
    return <TimepointListEntryPending {...props} />;
  }

  if (viewMode === 'uptime') {
    return <TimepointListEntryUptime {...props} />;
  }

  return <TimepointListEntryReachability {...props} />;
};

const getStyles = (theme: GrafanaTheme2, timepointWidth: number) => {
  return {
    timepoint: css`
      display: flex;
      justify-content: end;
      flex-direction: column;
      height: 100%;
      position: relative;
      width: ${timepointWidth + TIMEPOINT_GAP_PX}px;
    `,
  };
};
