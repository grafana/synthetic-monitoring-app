import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Stack, useTheme2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { TIMEPOINT_GAP, TIMEPOINT_WIDTH } from 'scenes/components/TimepointExplorer/TimepointExplorer.constants';
import { TimepointExplorerChild } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';

export const TimepointList = ({ miniMapSections, timepoints }: TimepointExplorerChild) => {
  const styles = getStyles(useTheme2());
  const activeSection = miniMapSections.find((section) => section.active);

  if (!activeSection) {
    return null;
  }

  const timepointsInRange = Object.keys(timepoints).slice(activeSection.fromIndex, activeSection.toIndex);

  return (
    <Stack direction="row" gap={TIMEPOINT_GAP} alignItems={`end`} height={12} justifyContent={`end`}>
      {timepointsInRange.reverse().map((timepoint, index) => (
        <div key={index} className={styles.timepoint}>
          <div className={styles.timepointText}>{new Date(Number(timepoint)).toLocaleTimeString()}</div>
        </div>
      ))}
    </Stack>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  timepoint: css`
    width: ${TIMEPOINT_WIDTH}px;
  `,
  timepointText: css`
    transform: rotate(-90deg);
    text-align: center;
  `,
});
