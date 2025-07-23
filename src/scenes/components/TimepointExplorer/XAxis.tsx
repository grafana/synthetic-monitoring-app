import React, { ReactNode, useMemo } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import {
  TIMEPOINT_GAP_PX,
  TIMEPOINT_SIZE,
  TIMEPOINT_THEME_HEIGHT,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.constants';
import { useTimepointExplorerContext } from 'scenes/components/TimepointExplorer/TimepointExplorer.context';
import { StatelessTimepoint, UnixTimestamp } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import { generateXAxisPoints } from 'scenes/components/TimepointExplorer/XAxis.utils';

interface XAxisProps {
  timeRange: { from: UnixTimestamp; to: UnixTimestamp };
  timepoints: StatelessTimepoint[];
  width: number;
}

export const XAxis = ({ timepoints, timeRange }: XAxisProps) => {
  const { width } = useTimepointExplorerContext();
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.container}>
      <div className={styles.empty} />
      {timepoints.length > 0 && (
        <div style={{ width: width }}>
          <XAxisContent timeRange={timeRange} timepoints={timepoints} width={width} />
        </div>
      )}
    </div>
  );
};

const XAxisContent = ({ timepoints, timeRange, width }: XAxisProps) => {
  const styles = useStyles2(getStyles);
  const points = useMemo(() => generateXAxisPoints(timepoints, timeRange), [timepoints, timeRange]);

  const renderedGaps = timepoints.length - 1;
  const widthWithoutGaps = width - renderedGaps * TIMEPOINT_GAP_PX;
  const renderedTimepointWidth = widthWithoutGaps / timepoints.length;
  const widthToUse = renderedTimepointWidth > TIMEPOINT_SIZE ? TIMEPOINT_SIZE : renderedTimepointWidth;

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
