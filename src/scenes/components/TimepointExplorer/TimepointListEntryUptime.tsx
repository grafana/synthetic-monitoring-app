import React from 'react';
import { colorManipulator, GrafanaTheme2 } from '@grafana/data';
import { Icon, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { SCENES_TEST_ID } from 'test/dataTestIds';

import { PARTIAL_FAILURE_SEGMENT_ALPHA } from 'scenes/components/TimepointExplorer/TimepointExplorer.constants';
import { useTimepointExplorerContext } from 'scenes/components/TimepointExplorer/TimepointExplorer.context';
import {
  useStatefulTimepoint,
  useTimepointVizOptions,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.hooks';
import { StatelessTimepoint, TimepointVizOption } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import { getFailureRatio } from 'scenes/components/TimepointExplorer/TimepointExplorer.utils';
import { TimepointListEntryBar } from 'scenes/components/TimepointExplorer/TimepointListEntryBar';

interface TimepointListEntryProps {
  timepoint: StatelessTimepoint;
}

export const TimepointListEntryUptime = ({ timepoint }: TimepointListEntryProps) => {
  const statefulTimepoint = useStatefulTimepoint(timepoint);
  const { status } = statefulTimepoint;
  const { vizDisplay } = useTimepointExplorerContext();
  const failureVizOption = useTimepointVizOptions('failure');
  const styles = useStyles2(getStyles, failureVizOption);
  const isSuccess = status === 'success';
  const isFailure = status === 'failure';
  const failureRatio = isSuccess ? getFailureRatio(statefulTimepoint.probeResults) : 0;
  const showPartialFailure = failureRatio > 0 && vizDisplay.includes('failure');
  // a success bar with partial failures counts as a failure result when filtering
  const isVisible = vizDisplay.includes(status) || showPartialFailure;

  if (!isVisible) {
    return <div />;
  }

  return (
    <TimepointListEntryBar
      analyticsEventName={`uptime-entry`}
      timepoint={timepoint}
      status={status}
      isVisible={isVisible}
    >
      {showPartialFailure && (
        <div
          className={styles.partialFailure}
          style={{ height: `${failureRatio * 100}%` }}
          data-testid={`${SCENES_TEST_ID.timepoint.listEntryFailureSegment}-${timepoint.index}`}
        />
      )}
      <span className={styles.statusIcon}>
        {isFailure ? (
          <Icon name={`times`} key={`times`} />
        ) : showPartialFailure ? (
          <Icon name={`exclamation-triangle`} key={`exclamation-triangle`} />
        ) : isSuccess ? (
          <Icon name={`check`} key={`check`} />
        ) : (
          `?`
        )}
      </span>
    </TimepointListEntryBar>
  );
};

const getStyles = (theme: GrafanaTheme2, failureVizOption: TimepointVizOption) => ({
  partialFailure: css`
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    background-color: ${colorManipulator.alpha(failureVizOption.statusColor, PARTIAL_FAILURE_SEGMENT_ALPHA)};
    pointer-events: none;
  `,
  // positioned so the icon paints above the partial-failure overlay, which is
  // absolutely positioned and would otherwise sit on top of in-flow content
  statusIcon: css`
    position: relative;
    display: inline-flex;
  `,
});
