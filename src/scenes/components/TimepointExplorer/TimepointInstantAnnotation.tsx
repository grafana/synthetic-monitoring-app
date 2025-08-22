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
  showLabels?: boolean;
  timepointsInRange: StatelessTimepoint[];
  triggerHeight: number;
}

export const TimepointInstantAnnotation = ({
  annotation,
  displayWidth,
  parentWidth,
  showLabels,
  timepointsInRange,
  triggerHeight,
}: TimepointInstantAnnotationProps) => {
  const styles = useStyles2((theme) => getStyles(theme, annotation, showLabels, triggerHeight));
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
      position: relative;
      transform: translate(0, -100%);
      width: 100%;
    `,
  };
};
