import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { useSceneVarProbes } from 'scenes/Common/useSceneVarProbes';
import { TIMEPOINT_GAP_PX } from 'scenes/components/TimepointExplorer/TimepointExplorer.constants';
import { useTimepointExplorerContext } from 'scenes/components/TimepointExplorer/TimepointExplorer.context';
import { useStatefulTimepoint } from 'scenes/components/TimepointExplorer/TimepointExplorer.hooks';
import { StatelessTimepoint } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import {
  getCouldBePending,
  getIsInTheFuture,
  getPendingProbeNames,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.utils';
import { TimepointListEntryLoading } from 'scenes/components/TimepointExplorer/TimepointListEntryLoading';
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
    <div className={styles.timepoint} data-testid={`timepoint-${timepoint.index}`}>
      <Entry timepoint={timepoint} viewIndex={viewIndex} />
    </div>
  );
};

const Entry = (props: TimepointListEntryProps) => {
  const { check, currentAdjustedTime, isLoading, viewMode } = useTimepointExplorerContext();
  const statefulTimepoint = useStatefulTimepoint(props.timepoint);
  const isInTheFuture = getIsInTheFuture(props.timepoint, currentAdjustedTime);
  const selectedProbeNames = useSceneVarProbes(check);
  const couldBePending = getCouldBePending(props.timepoint, currentAdjustedTime);
  const pendingProbeNames = getPendingProbeNames({ statefulTimepoint, selectedProbeNames });
  const isEntryLoading = isLoading && statefulTimepoint.status === 'missing';

  if (props.timepoint.config.type === 'no-data' || isInTheFuture) {
    return <div />;
  }

  if (isEntryLoading) {
    return <TimepointListEntryLoading />;
  }

  if (couldBePending && pendingProbeNames.length) {
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
