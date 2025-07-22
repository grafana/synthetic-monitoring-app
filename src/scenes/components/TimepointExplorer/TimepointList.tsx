import React, { forwardRef } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import {
  TIMEPOINT_GAP,
  TIMEPOINT_LIST_ID,
  TIMEPOINT_THEME_HEIGHT,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.constants';
import { TimepointExplorerChild } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import { TimepointListAnnotations } from 'scenes/components/TimepointExplorer/TimepointListAnnotations';
import { TimepointListEntry } from 'scenes/components/TimepointExplorer/TimepointListEntry';
import { XAxis } from 'scenes/components/TimepointExplorer/XAxis';
import { YAxis } from 'scenes/components/TimepointExplorer/YAxis';

export const TimepointList = forwardRef<HTMLDivElement, TimepointExplorerChild>(
  (
    {
      annotations,
      handleTimepointSelection,
      maxProbeDuration,
      miniMapSections,
      selectedTimepoint,
      timepointDisplayCount,
      timepoints,
      timeRange,
      viewMode,
      width,
    },
    ref
  ) => {
    const activeSection = miniMapSections.find((section) => section.active);
    const styles = useStyles2(getStyles);
    const timepointsInRange = timepoints.slice(activeSection?.fromIndex, activeSection?.toIndex).reverse();

    return (
      <div>
        <div className={styles.container}>
          <YAxis maxProbeDuration={maxProbeDuration} width={width} />
          <div className={styles.timepointsContainer}>
            <TimepointListAnnotations
              annotations={annotations}
              timepointsInRange={timepointsInRange}
              timepointDisplayCount={timepointDisplayCount}
            />
            <div ref={ref} className={styles.timepoints} id={TIMEPOINT_LIST_ID}>
              {activeSection &&
                timepointsInRange.map((timepoint, index) => {
                  return (
                    <TimepointListEntry
                      annotations={annotations}
                      handleTimepointSelection={handleTimepointSelection}
                      key={index}
                      maxProbeDuration={maxProbeDuration}
                      selectedTimepoint={selectedTimepoint}
                      timepoint={timepoint}
                      viewIndex={index}
                      viewMode={viewMode}
                    />
                  );
                })}
            </div>
          </div>
        </div>
        <XAxis
          timeRange={timeRange}
          timepointsInRange={timepointsInRange}
          width={width}
          activeSection={activeSection}
        />
      </div>
    );
  }
);

TimepointList.displayName = 'TimepointList';

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    display: flex;
    position: relative;
    z-index: 1;
  `,
  timepoints: css`
    display: flex;
    flex-direction: row;
    gap: ${theme.spacing(TIMEPOINT_GAP)};
    align-items: end;
    height: ${theme.spacing(TIMEPOINT_THEME_HEIGHT)};
    justify-content: end;
    position: relative;
  `,
  timepointsContainer: css`
    position: relative;
    flex: 1;
    overflow: hidden;
    padding-top: ${theme.spacing(3)};
  `,
  gridMarkers: css`
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  `,
});
