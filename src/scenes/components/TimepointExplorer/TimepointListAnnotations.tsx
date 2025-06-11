import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import {
  THEME_UNIT,
  TIMEPOINT_GAP,
  TIMEPOINT_SIZE,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.constants';
import { Annotation, Timepoint } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';

export const TimepointListAnnotations = ({
  annotations,
  timepointsInRange,
  timepointDisplayCount,
}: {
  annotations: Annotation[];
  timepointsInRange: Timepoint[];
  timepointDisplayCount: number;
}) => {
  const styles = useStyles2(getStyles);
  const renderOrderedTimepoints = [...timepointsInRange].reverse();
  const timepointsInRangeAdjustedTimes = timepointsInRange.map((timepoint) => timepoint.adjustedTime);

  const annotationsToRender = annotations.filter((annotation) => {
    return timepointsInRangeAdjustedTimes.some((timepoint) => {
      return [annotation.timepointStart.adjustedTime, annotation.timepointEnd.adjustedTime].includes(timepoint);
    });
  });

  return (
    <div className={styles.container}>
      {annotationsToRender.map((annotation) => {
        const timepointEndIndex = renderOrderedTimepoints.findIndex(
          (timepoint) => timepoint.adjustedTime === annotation.timepointEnd.adjustedTime
        );
        const right = (100 / timepointDisplayCount) * timepointEndIndex;

        return (
          <div
            key={`${annotation.checkEvent.label}-${annotation.timepointEnd.adjustedTime}`}
            className={styles.annotation}
            style={{
              right: `calc(${right}% + ${TIMEPOINT_SIZE + (TIMEPOINT_GAP * THEME_UNIT) / 2}px)`,
            }}
          >
            <div className={styles.label}>{annotation.checkEvent.label}</div>
          </div>
        );
      })}
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    position: absolute;
    bottom: 0;
    left: 0;
    height: 100%;
    width: 100%;
  `,
  annotation: css`
    height: 80%;
    border-right: 1px dashed yellow;
    position: absolute;
    bottom: 0;
  `,
  label: css`
    position: relative;
    left: 50%;
    width: 100%;
    padding: ${theme.spacing(1)};
    transform: translate(0, -100%);
    border: 1px dashed yellow;
  `,
});
