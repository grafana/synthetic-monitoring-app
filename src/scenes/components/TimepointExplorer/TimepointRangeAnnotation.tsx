import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Box, measureText, Text, Tooltip, useStyles2, useTheme2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { formatDate } from 'utils';
import { StatelessTimepoint } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import { AnnotationWithIndices } from 'scenes/components/TimepointExplorer/TimepointExplorerAnnotations.utils';

interface TimepointRangeAnnotationProps {
  annotation: AnnotationWithIndices;
  displayWidth: number;
  parentWidth: number;
  showLabels?: boolean;
  showTooltips?: boolean;
  timepointsInRange: StatelessTimepoint[];
  triggerHeight: number;
}

export const TimepointRangeAnnotation = ({
  annotation,
  displayWidth,
  parentWidth,
  showLabels: showLabelsProp,
  showTooltips: showTooltipsProp,
  timepointsInRange,
  triggerHeight,
}: TimepointRangeAnnotationProps) => {
  const styles = useStyles2((theme) => getStyles(theme, annotation, triggerHeight));
  const visibleWidth = displayWidth * (annotation.visibleEndIndex - annotation.visibleStartIndex + 1);
  const rightOffset = displayWidth * (timepointsInRange.length - annotation.visibleEndIndex - 1);
  const isOutsideOfVisibleRange = rightOffset > parentWidth;
  const theme = useTheme2();
  const annotationTooSlimForLabel =
    visibleWidth < measureText(annotation.checkEvent.label, 14).width + parseInt(theme.spacing(2), 10);
  const showLabels = showLabelsProp && !annotationTooSlimForLabel;

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
      {showLabels && <div className={styles.label}>{annotation.checkEvent.label}</div>}
      <AnnotationInformation
        annotation={annotation}
        showTooltips={annotationTooSlimForLabel ? true : showTooltipsProp}
        triggerHeight={triggerHeight}
      />
    </div>
  );
};

interface AnnotationInformationProps {
  annotation: AnnotationWithIndices;
  showTooltips?: boolean;
  triggerHeight: number;
}

const AnnotationInformation = ({ annotation, showTooltips, triggerHeight }: AnnotationInformationProps) => {
  const styles = useStyles2((theme) => getStyles(theme, annotation, triggerHeight));

  if (!showTooltips) {
    return <div className={styles.annotationInformation} />;
  }

  return (
    <Tooltip content={<AnnotationTooltip annotation={annotation} />} interactive placement="top">
      <div className={styles.annotationInformation} />
    </Tooltip>
  );
};

const AnnotationTooltip = ({ annotation }: { annotation: AnnotationWithIndices }) => {
  const styles = useStyles2((theme) => getStyles(theme, annotation));

  return (
    <div className={styles.annotationTooltip}>
      {annotation.checkEvent.from && annotation.checkEvent.to && (
        <>
          <Box padding={1}>
            <Text>
              {formatDate(annotation.checkEvent.from)} - {formatDate(annotation.checkEvent.to)}
            </Text>
          </Box>
          <div className={styles.divider} />
        </>
      )}
      <Box padding={1}>
        <Text>{annotation.checkEvent.label}</Text>
      </Box>
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2, annotation?: AnnotationWithIndices, triggerHeight?: number) => {
  // Determine if we're showing the actual start/end of the range (not clipped)
  const showingActualStart = !annotation?.isClippedStart;
  const showingActualEnd = !annotation?.isClippedEnd;

  const borderColor = theme.visualization.getColorByName(annotation?.checkEvent.color!);
  const backgroundColor = `${borderColor}30`;

  return {
    annotation: css`
      background-color: ${backgroundColor};
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
    annotationInformation: css`
      background-color: ${borderColor};
      bottom: 0;
      height: ${triggerHeight}px;
      pointer-events: all;
      position: absolute;
      width: 100%;
      z-index: 3;
    `,
    annotationTooltip: css`
      border: 1px solid ${theme.colors.border.medium};
      border-radius: ${theme.shape.radius.default};
      margin: ${theme.spacing(-0.5, -1)};
    `,
    divider: css`
      background-color: ${theme.colors.border.medium};
      height: 1px;
      width: 100%;
    `,
  };
};
