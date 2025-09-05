import React from 'react';
import { dateTimeFormat, GrafanaTheme2 } from '@grafana/data';
import { Box, measureText, Text, Tooltip, useStyles2, useTheme2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { StatelessTimepoint } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import { AnnotationWithIndices } from 'scenes/components/TimepointExplorer/TimepointExplorerAnnotations.utils';
import { getOffsetAndDirection } from 'scenes/components/TimepointExplorer/TimepointRangeAnnotation.utils';

interface TimepointRangeAnnotationProps {
  annotation: AnnotationWithIndices;
  displayWidth: number;
  renderingStrategy: 'start' | 'end';
  showLabels?: boolean;
  showTooltips?: boolean;
  timepointsInRange: StatelessTimepoint[];
  triggerHeight: number;
}

export const TimepointRangeAnnotation = ({
  annotation,
  displayWidth,
  renderingStrategy,
  showLabels: showLabelsProp,
  showTooltips: showTooltipsProp,
  timepointsInRange,
  triggerHeight,
}: TimepointRangeAnnotationProps) => {
  const styles = useStyles2((theme) => getStyles(theme, annotation, triggerHeight));
  const { offset, direction } = getOffsetAndDirection(renderingStrategy, displayWidth, timepointsInRange, annotation);
  const visibleWidth = displayWidth * (annotation.visibleEndIndex - annotation.visibleStartIndex + 1);
  const theme = useTheme2();
  const annotationTooSlimForLabel = showLabelsProp
    ? visibleWidth < measureText(annotation.checkEvent.label, 14).width + parseInt(theme.spacing(2), 10)
    : false;
  const showLabels = showLabelsProp && !annotationTooSlimForLabel;

  return (
    <div
      className={styles.annotation}
      style={{
        [direction]: `${offset}px`,
        width: `${visibleWidth}px`,
      }}
    >
      {showLabels && <div className={styles.label}>{annotation.checkEvent.label}</div>}
      <AnnotationInformation
        annotation={annotation}
        annotationTooSlimForLabel={annotationTooSlimForLabel}
        showTooltips={showTooltipsProp}
        triggerHeight={triggerHeight}
      />
    </div>
  );
};

interface AnnotationInformationProps {
  annotation: AnnotationWithIndices;
  annotationTooSlimForLabel: boolean;
  showTooltips?: boolean;
  triggerHeight: number;
}

const AnnotationInformation = ({
  annotation,
  annotationTooSlimForLabel,
  showTooltips,
  triggerHeight,
}: AnnotationInformationProps) => {
  const styles = useStyles2((theme) => getStyles(theme, annotation, triggerHeight));

  if (!showTooltips && !annotationTooSlimForLabel) {
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
              {dateTimeFormat(annotation.checkEvent.from)} - {dateTimeFormat(annotation.checkEvent.to)}
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

      &:hover {
        z-index: 1000;
      }
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
