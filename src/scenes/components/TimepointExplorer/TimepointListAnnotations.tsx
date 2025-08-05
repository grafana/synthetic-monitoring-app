import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import {
  TIMEPOINT_GAP_PX,
  TIMEPOINT_LIST_ANNOTATIONS_ID,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.constants';
import { useTimepointExplorerContext } from 'scenes/components/TimepointExplorer/TimepointExplorer.context';
import { StatelessTimepoint } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';

export const TimepointListAnnotations = ({ timepointsInRange }: { timepointsInRange: StatelessTimepoint[] }) => {
  const { annotations, timepointWidth } = useTimepointExplorerContext();
  const styles = useStyles2(getStyles);
  const renderOrderedTimepoints = [...timepointsInRange].reverse();
  const timepointsInRangeAdjustedTimes = timepointsInRange.map((timepoint) => timepoint.adjustedTime);

  const annotationsToRender = annotations.filter((annotation) => {
    return timepointsInRangeAdjustedTimes.some((timepoint) => {
      return [annotation.timepointStart.adjustedTime, annotation.timepointEnd.adjustedTime].includes(timepoint);
    });
  });

  return (
    <div className={styles.container} id={TIMEPOINT_LIST_ANNOTATIONS_ID}>
      {annotationsToRender.map((annotation) => {
        const timepointEndIndex = renderOrderedTimepoints.findIndex(
          (timepoint) => timepoint.adjustedTime === annotation.timepointEnd.adjustedTime
        );
        const right = (timepointWidth + TIMEPOINT_GAP_PX) * (timepointEndIndex + 1);

        return (
          <div
            key={`${annotation.checkEvent.label}-${annotation.timepointEnd.adjustedTime}`}
            className={styles.annotation}
            style={{
              right: `${right}px`,
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
