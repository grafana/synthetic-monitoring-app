import React, { ReactNode, useMemo } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { useTimeRange } from '@grafana/scenes-react';
import { useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import {
  TIMEPOINT_GAP_PX,
  TIMEPOINT_THEME_HEIGHT,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.constants';
import { useTimepointExplorerContext } from 'scenes/components/TimepointExplorer/TimepointExplorer.context';
import { StatelessTimepoint } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import { doesTimeRangeCrossDays, generateXAxisPoints } from 'scenes/components/TimepointExplorer/XAxis.utils';

interface XAxisProps {
  timepoints: StatelessTimepoint[];
}

export const XAxis = ({ timepoints }: XAxisProps) => {
  const { listWidth } = useTimepointExplorerContext();
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.container}>
      <div className={styles.empty} />
      {timepoints.length > 0 && (
        <div style={{ width: listWidth }}>
          <XAxisContent timepoints={timepoints} />
        </div>
      )}
    </div>
  );
};

const XAxisContent = ({ timepoints }: XAxisProps) => {
  const { listWidth, timepointWidth } = useTimepointExplorerContext();
  const styles = useStyles2(getStyles);
  const [dashboardTimeRange] = useTimeRange();
  const crossesDays = doesTimeRangeCrossDays(dashboardTimeRange.from.toDate(), dashboardTimeRange.to.toDate());
  const points = useMemo(
    () => generateXAxisPoints(timepoints, crossesDays, timepointWidth),
    [timepoints, crossesDays, timepointWidth]
  );

  const renderedGaps = timepoints.length - 1;
  const widthWithoutGaps = listWidth - renderedGaps * TIMEPOINT_GAP_PX;
  const renderedTimepointWidth = widthWithoutGaps / timepoints.length;
  const widthToUse = renderedTimepointWidth > timepointWidth ? timepointWidth : renderedTimepointWidth;

  return (
    <div className={styles.labelContainer}>
      {points.map((point) => {
        return (
          <XAxisLabel key={point.label} index={point.index} timepointWidth={widthToUse}>
            {point.label}
          </XAxisLabel>
        );
      })}
    </div>
  );
};

const XAxisLabel = ({
  children,
  index,
  timepointWidth,
}: {
  children: ReactNode;
  index: number;
  timepointWidth: number;
}) => {
  const styles = useStyles2(getStyles);
  const offset = index * (timepointWidth + TIMEPOINT_GAP_PX);

  return (
    <div className={styles.label} style={{ right: offset + timepointWidth / 2 }}>
      <div className={styles.text}>{children}</div>
      <div className={styles.line} />
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => {
  return {
    container: css`
      min-height: ${theme.spacing(6)};
      display: flex;
      align-items: center;
    `,
    empty: css`
      flex: 1;
    `,
    labelContainer: css`
      position: relative;
    `,
    label: css`
      position: absolute;
      width: 1px;
    `,
    text: css`
      position: absolute;
      transform: translateX(-50%);
      white-space: nowrap;
      font-size: ${theme.typography.bodySmall.fontSize};
    `,
    line: css`
      position: absolute;
      top: ${theme.spacing(-3)};
      width: 1px;
      height: calc(${theme.spacing(TIMEPOINT_THEME_HEIGHT)} + ${theme.spacing(3)});
      background-color: ${theme.colors.border.weak};
      transform: translateY(-100%);
    `,
  };
};
