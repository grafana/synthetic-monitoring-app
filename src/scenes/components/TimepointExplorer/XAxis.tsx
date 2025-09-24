import React, { ReactNode, useMemo } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { useTimeRange } from '@grafana/scenes-react';
import { useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import {
  ANNOTATION_GRAPH_TRIGGER_HEIGHT_PX,
  TIMEPOINT_GAP_PX,
  TIMEPOINT_SIZE,
  TIMEPOINT_THEME_HEIGHT,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.constants';
import { useTimepointExplorerContext } from 'scenes/components/TimepointExplorer/TimepointExplorer.context';
import { StatelessTimepoint } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import { buildXAxisPoints, doesTimeRangeCrossDays } from 'scenes/components/TimepointExplorer/XAxis.utils';

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
  const { renderingStrategy, timepointWidth } = useTimepointExplorerContext();
  const styles = useStyles2(getStyles);
  const [dashboardTimeRange] = useTimeRange();
  const crossesDays = doesTimeRangeCrossDays(dashboardTimeRange.from.toDate(), dashboardTimeRange.to.toDate());
  const points = useMemo(
    () => buildXAxisPoints({ timepoints, crossesDays, timepointWidth, renderingStrategy }),
    [timepoints, crossesDays, timepointWidth, renderingStrategy]
  );

  return (
    <div className={styles.labelContainer}>
      {points.map((point) => {
        return (
          <XAxisLabel key={point.label} index={point.index} renderingStrategy={renderingStrategy}>
            {point.label}
          </XAxisLabel>
        );
      })}
    </div>
  );
};

interface XAxisLabelProps {
  children: ReactNode;
  index: number;
  renderingStrategy: 'start' | 'end';
}

const XAxisLabel = ({ children, index, renderingStrategy }: XAxisLabelProps) => {
  const styles = useStyles2(getStyles);
  const timepointWidth = TIMEPOINT_SIZE + TIMEPOINT_GAP_PX;
  const offset = index * timepointWidth;
  const direction = renderingStrategy === 'start' ? 'left' : 'right';

  return (
    <div className={styles.label} style={{ [direction]: -1 + offset + timepointWidth / 2 }}>
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
      top: calc(${theme.spacing(-3)} - ${ANNOTATION_GRAPH_TRIGGER_HEIGHT_PX}px);
      width: 1px;
      height: calc(${theme.spacing(TIMEPOINT_THEME_HEIGHT)} + ${theme.spacing(3)});
      background-color: ${theme.colors.border.weak};
      transform: translateY(-100%);
    `,
  };
};
