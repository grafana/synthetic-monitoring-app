import React, { forwardRef } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { GridMarkers } from 'scenes/components/TimepointExplorer/GridMarkers';
import { TIMEPOINT_GAP, TIMEPOINT_THEME_HEIGHT } from 'scenes/components/TimepointExplorer/TimepointExplorer.constants';
import { TimepointExplorerChild } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import { TimepointListEntry } from 'scenes/components/TimepointExplorer/TimepointListEntry';

export const TimepointList = forwardRef<HTMLDivElement, TimepointExplorerChild>(
  ({ miniMapSections, timepoints, maxProbeDurationData = 1500, viewMode, width }, ref) => {
    const activeSection = miniMapSections.find((section) => section.active);
    const styles = useStyles2(getStyles);

    const timepointsInRange = timepoints.slice(activeSection?.fromIndex, activeSection?.toIndex);

    return (
      <div className={styles.container}>
        <GridMarkers maxProbeDurationData={maxProbeDurationData} width={width} />

        <div ref={ref} className={styles.timepoints}>
          {activeSection &&
            timepointsInRange
              .reverse()
              .map((timepoint, index) => (
                <TimepointListEntry
                  key={index}
                  timepoint={timepoint}
                  maxProbeDurationData={maxProbeDurationData}
                  viewMode={viewMode}
                />
              ))}
        </div>
      </div>
    );
  }
);

TimepointList.displayName = 'TimepointList';

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    display: flex;
    padding-top: ${theme.spacing(3)};
  `,
  timepoints: css`
    display: flex;
    flex-direction: row;
    gap: ${theme.spacing(TIMEPOINT_GAP)};
    align-items: end;
    height: ${theme.spacing(TIMEPOINT_THEME_HEIGHT)};
    justify-content: end;
    position: relative;
    flex: 1;
    overflow: hidden;
    padding-top: ${theme.spacing(4)};
  `,
  gridMarkers: css`
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  `,
});
