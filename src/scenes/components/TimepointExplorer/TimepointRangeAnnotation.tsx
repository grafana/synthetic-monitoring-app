import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { StatelessTimepoint } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import { AnnotationWithIndices } from 'scenes/components/TimepointExplorer/TimepointExplorerAnnotations.utils';

interface TimepointRangeAnnotationProps {
  annotation: AnnotationWithIndices;
  displayLabels?: boolean;
  displayWidth: number;
  parentWidth: number;
  timepointsInRange: StatelessTimepoint[];
}

export const TimepointRangeAnnotation = ({
  annotation,
  displayLabels,
  displayWidth,
  parentWidth,
  timepointsInRange,
}: TimepointRangeAnnotationProps) => {
  const styles = useStyles2((theme) => getStyles(theme, annotation));
  const visibleWidth = displayWidth * (annotation.visibleEndIndex - annotation.visibleStartIndex + 1);
  const rightOffset = displayWidth * (timepointsInRange.length - annotation.visibleEndIndex - 1);
  const isOutsideOfVisibleRange = rightOffset > parentWidth;

  if (isOutsideOfVisibleRange) {
    return null;
  }

  return (
    <div
      className={styles.annotation}
      style={{
        right: `${rightOffset}px`,
        width: `${visibleWidth}px`,
      }}
    >
      {displayLabels && <div className={styles.label}>{annotation.checkEvent.label}</div>}
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2, annotation?: AnnotationWithIndices) => {
  // Determine if we're showing the actual start/end of the range (not clipped)
  const showingActualStart = !annotation?.isClippedStart;
  const showingActualEnd = !annotation?.isClippedEnd;

  const borderColor = theme.visualization.getColorByName(annotation?.checkEvent.color!);
  const backgroundColor = `${borderColor}30`;

  return {
    annotation: css`
      background-color: ${backgroundColor};
      border-bottom: 2px solid ${borderColor};
      border-left: ${showingActualStart ? `2px dashed ${borderColor}` : 'none'};
      border-right: ${showingActualEnd ? `2px dashed ${borderColor}` : 'none'};
      bottom: 0;
      height: 100%;
      pointer-events: none;
      position: absolute;
    `,
    label: css`
      background-color: ${theme.colors.background.primary};
      border: 1px dashed ${borderColor};
      display: inline-flex;
      left: 50%;
      padding: ${theme.spacing(1)};
      pointer-events: all;
      position: relative;
      top: 50%;
      transform: translate(-50%, -50%);
      z-index: 1;
    `,
  };
};
