import React, { ReactNode, useEffect, useMemo, useState } from 'react';
import { GrafanaTheme2, TimeRange } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { TIMEPOINT_THEME_HEIGHT } from 'scenes/components/TimepointExplorer/TimepointExplorer.constants';
import { MinimapSection, Timepoint } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import { calculatePositions, doesTimeRangeCrossDays } from 'scenes/components/TimepointExplorer/XAxis.utils';

interface XAxisProps {
  timeRange: TimeRange;
  timepointsInRange: Timepoint[];
  width: number;
  activeSection: MinimapSection;
}

export const XAxis = ({
  timeRange,
  timepointsInRange,
  width,
  activeSection,
}: Omit<XAxisProps, 'activeSection'> & { activeSection?: MinimapSection }) => {
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.container}>
      <div className={styles.empty} />
      {activeSection && timepointsInRange.length > 0 && (
        <div style={{ width: width }}>
          <XAxisContent
            timeRange={timeRange}
            timepointsInRange={timepointsInRange}
            width={width}
            activeSection={activeSection}
          />
        </div>
      )}
    </div>
  );
};

const XAxisContent = ({ activeSection, timeRange, width }: XAxisProps) => {
  const styles = useStyles2(getStyles);
  const [points, setPoints] = useState(calculatePositions(activeSection));
  const crossesDays = useMemo(() => doesTimeRangeCrossDays(timeRange), [timeRange]);

  useEffect(() => {
    setPoints(calculatePositions(activeSection));
  }, [activeSection, width]);

  return (
    <div className={styles.labelContainer}>
      {points.map((point) => {
        const date = new Date(point.label);

        return (
          <XAxisLabel key={point.label} position={point.position}>
            {crossesDays ? date.toLocaleString() : date.toLocaleTimeString()}
          </XAxisLabel>
        );
      })}
    </div>
  );
};

const XAxisLabel = ({ children, position }: { children: ReactNode; position: number }) => {
  const styles = useStyles2(getStyles);
  return (
    <div className={styles.label} style={{ left: position }}>
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
      display: flex;
      justify-content: space-between;
      position: relative;
    `,
    label: css`
      position: absolute;
    `,
    text: css`
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
