import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { StatelessTimepoint } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import { AnnotationWithIndices } from 'scenes/components/TimepointExplorer/TimepointExplorerAnnotations.utils';

interface TimepointInstantAnnotationProps {
  annotation: AnnotationWithIndices;
  displayLabels?: boolean;
  displayWidth: number;
  timepointsInRange: StatelessTimepoint[];
}

export const TimepointInstantAnnotation = ({
  annotation,
  displayLabels,
  displayWidth,
  timepointsInRange,
}: TimepointInstantAnnotationProps) => {
  const styles = useStyles2((theme) => getStyles(theme, displayLabels));
  const displayIndex = timepointsInRange.length - annotation.visibleEndIndex;
  const right = displayWidth * displayIndex - displayWidth / 2 - 1;

  return (
    <div
      className={styles.annotation}
      style={{
        right: `${right}px`,
      }}
    >
      {displayLabels && (
        <div className={styles.label}>
          {annotation.label} {new Date(annotation.to).toISOString()}
        </div>
      )}
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2, displayLabels?: boolean) => ({
  annotation: css`
    height: ${displayLabels ? '80%' : '100%'};
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
