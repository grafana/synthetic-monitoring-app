import React, { forwardRef } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Stack, useTheme2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { TIMEPOINT_GAP, TIMEPOINT_WIDTH } from 'scenes/components/TimepointExplorer/TimepointExplorer.constants';
import { TimepointExplorerChild } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';

export const TimepointList = forwardRef<HTMLDivElement, TimepointExplorerChild>(function TimepointList(
  {
    timeRange,
    timepointsInRange,
    viewTimeRangeTo,
    timepointsToDisplay: timePointsToDisplay,
    handleTimeRangeToInViewChange,
    width,
  },
  ref
) {
  const styles = getStyles(useTheme2());

  return (
    <div ref={ref}>
      <Stack direction="row" gap={TIMEPOINT_GAP}>
        {Array.from({ length: timePointsToDisplay }).map((_, index) => (
          <div key={index} className={styles.timepoint}>
            {index + 1}
          </div>
        ))}
      </Stack>
    </div>
  );
});

const getStyles = (theme: GrafanaTheme2) => ({
  timepoint: css`
    width: ${TIMEPOINT_WIDTH}px;
  `,
});
