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
  parentWidth: number;
  timepointsInRange: StatelessTimepoint[];
}

export const TimepointInstantAnnotation = ({
  annotation,
  displayLabels,
  displayWidth,
  parentWidth,
  timepointsInRange,
}: TimepointInstantAnnotationProps) => {
  const styles = useStyles2((theme) => getStyles(theme, annotation, displayLabels));
  const displayIndex = timepointsInRange.length - annotation.visibleEndIndex;
  const centerOffset = displayWidth / 2;
  const right = displayWidth * displayIndex - centerOffset;
  const isOutsideOfVisibleRange = right > parentWidth;

  if (isOutsideOfVisibleRange) {
    return null;
  }

  return (
    <div
      className={styles.annotation}
      style={{
        right: `${right}px`,
      }}
    >
      {displayLabels && <div className={styles.label}>{annotation.checkEvent.label} </div>}
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2, annotation: AnnotationWithIndices, displayLabels?: boolean) => {
  const borderColor = theme.visualization.getColorByName(annotation?.checkEvent.color!);

  return {
    annotation: css`
      border-right: 1px dashed ${borderColor};
      bottom: 0;
      height: ${displayLabels ? '80%' : '100%'};
      pointer-events: none;
      position: absolute;
      z-index: 2;
    `,
    label: css`
      background-color: ${theme.colors.background.primary};
      border: 1px dashed ${borderColor};
      left: 50%;
      padding: ${theme.spacing(1)};
      pointer-events: all;
      position: relative;
      transform: translate(0, -100%);
      width: 100%;
    `,
  };
};
