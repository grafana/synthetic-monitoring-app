import React from 'react';
import { dateTimeFormat, GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { StatelessTimepoint } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import { AnnotationWithIndices } from 'scenes/components/TimepointExplorer/TimepointExplorerAnnotations.utils';

interface TimepointInstantAnnotationProps {
  annotation: AnnotationWithIndices;
  displayWidth: number;
  parentWidth: number;
  renderingStrategy: 'start' | 'end';
  showLabels?: boolean;
  timepointsInRange: StatelessTimepoint[];
  triggerHeight: number;
}

export const TimepointInstantAnnotation = ({
  annotation,
  displayWidth,
  parentWidth,
  renderingStrategy,
  showLabels,
  timepointsInRange,
  triggerHeight,
}: TimepointInstantAnnotationProps) => {
  const styles = useStyles2((theme) => getStyles(theme, annotation, showLabels, triggerHeight));
  const { direction, offset } = getOffsetAndDirection(renderingStrategy, displayWidth, timepointsInRange, annotation);
  const isOutsideOfVisibleRange = offset > parentWidth;

  if (isOutsideOfVisibleRange) {
    return null;
  }

  return (
    <div
      className={styles.annotation}
      style={{
        [direction]: `${offset}px`,
      }}
    >
      {showLabels && (
        <div className={styles.label}>
          <div>{annotation.checkEvent.label}</div>
          {annotation.checkEvent.from && (
            <div>{dateTimeFormat(annotation.checkEvent.from, { format: 'yyyy/MM/DD HH:mm:ss' })}</div>
          )}
        </div>
      )}
    </div>
  );
};

function getOffsetAndDirection(
  renderingStrategy: 'start' | 'end',
  displayWidth: number,
  timepointsInRange: StatelessTimepoint[],
  annotation: AnnotationWithIndices
) {
  if (renderingStrategy === 'start') {
    return {
      direction: 'left',
      offset: displayWidth * annotation.visibleEndIndex + displayWidth / 2,
    };
  }

  const displayIndex = timepointsInRange.length - annotation.visibleEndIndex;

  return {
    direction: 'right',
    offset: displayWidth * displayIndex - displayWidth / 2,
  };
}

const getStyles = (
  theme: GrafanaTheme2,
  annotation: AnnotationWithIndices,
  showLabels?: boolean,
  triggerHeight?: number
) => {
  const borderColor = theme.visualization.getColorByName(annotation?.checkEvent.color!);

  return {
    annotation: css`
      border-right: 1px dashed ${borderColor};
      bottom: ${triggerHeight}px;
      height: ${showLabels ? '80%' : '100%'};
      pointer-events: none;
      position: absolute;
      z-index: 2;

      &:hover {
        z-index: 3;
      }
    `,
    label: css`
      background-color: ${theme.colors.background.primary};
      border: 1px dashed ${borderColor};
      left: 50%;
      padding: ${theme.spacing(1)};
      pointer-events: all;
      position: absolute;
      transform: translate(-50%, -100%);
      width: 170px;
    `,
  };
};
