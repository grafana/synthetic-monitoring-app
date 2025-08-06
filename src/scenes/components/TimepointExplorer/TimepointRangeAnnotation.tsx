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
  timepointsInRange: StatelessTimepoint[];
}

export const TimepointRangeAnnotation = ({
  annotation,
  displayLabels,
  displayWidth,
  timepointsInRange,
}: TimepointRangeAnnotationProps) => {
  const styles = useStyles2((theme) => getStyles(theme, displayLabels, annotation));

  // Calculate position and width based on visible indices (clipped to current section)
  const visibleWidth = displayWidth * (annotation.visibleEndIndex - annotation.visibleStartIndex + 1);
  const rightOffset = displayWidth * (timepointsInRange.length - annotation.visibleEndIndex - 1);

  return (
    <div
      className={styles.annotation}
      style={{
        right: `${rightOffset}px`,
        width: `${visibleWidth}px`,
      }}
    >
      {displayLabels && <div className={styles.label}>{annotation.label}</div>}
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2, displayLabels?: boolean, annotation?: AnnotationWithIndices) => {
  // Determine if we're showing the actual start/end of the range (not clipped)
  const showingActualStart =
    annotation && annotation.startingIndex !== -1 && annotation.visibleStartIndex === annotation.startingIndex;
  const showingActualEnd =
    annotation && annotation.endingIndex !== -1 && annotation.visibleEndIndex === annotation.endingIndex;

  const borderColor = theme.colors.error.border;
  const backgroundColor = theme.colors.error.transparent;

  return {
    annotation: css`
      height: ${displayLabels ? '80%' : '100%'};
      background-color: ${backgroundColor};
      border-left: ${showingActualStart ? `2px solid ${borderColor}` : 'none'};
      border-right: ${showingActualEnd ? `2px solid ${borderColor}` : 'none'};
      position: absolute;
      bottom: 0;
    `,
    label: css`
      display: inline-flex;
      position: relative;
      left: 50%;
      top: 50%;
      padding: ${theme.spacing(1)};
      transform: translate(-50%, -50%);
      border: 1px dashed ${borderColor};
      background-color: ${theme.colors.background.primary};
      font-size: ${theme.typography.bodySmall.fontSize};
    `,
  };
};
