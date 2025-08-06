import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckEvent, StatelessTimepoint } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';

interface OutOfTimeRangeAnnotationProps {
  annotation: CheckEvent & { startingIndex: number; endingIndex: number };
  displayLabels?: boolean;
  displayWidth: number;
  timepointsInRange: StatelessTimepoint[];
}

export const OutOfTimeRangeAnnotation = ({
  annotation,
  displayLabels,
  displayWidth,
  timepointsInRange,
}: OutOfTimeRangeAnnotationProps) => {
  const styles = useStyles2((theme) => getStyles(theme, displayLabels));
  const right = displayWidth * (timepointsInRange.length - annotation.endingIndex);

  return (
    <div
      className={styles.annotation}
      style={{
        right: `${right}px`,
        width: `${displayWidth * (annotation.endingIndex - annotation.startingIndex + 1)}px`,
      }}
    >
      {displayLabels && <div className={styles.label}>{annotation.label}</div>}
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2, displayLabels?: boolean) => ({
  annotation: css`
    height: ${displayLabels ? '80%' : '100%'};
    border-right: 1px dashed red;
    position: absolute;
    bottom: 0;
  `,
  label: css`
    position: relative;
    left: 50%;
    width: 100%;
    padding: ${theme.spacing(1)};
    transform: translate(0, -100%);
    border: 1px dashed red;
  `,
});
