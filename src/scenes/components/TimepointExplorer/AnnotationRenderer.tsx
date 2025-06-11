import React, { useCallback, useEffect, useRef, useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { useResizeObserver } from 'usehooks-ts';

import { TIMEPOINT_LIST_ID, TIMEPOINT_SIZE } from 'scenes/components/TimepointExplorer/TimepointExplorer.constants';
import { Annotation, Timepoint } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';

export const AnnotationRender = ({
  annotation,
  timepointsInRange,
}: {
  annotation: Annotation;
  timepointsInRange: Timepoint[];
}) => {
  const isAnnotationRange = annotation.timepointStart.adjustedTime !== annotation.timepointEnd.adjustedTime;

  if (isAnnotationRange) {
    return <AnnotationRangeRenderer annotation={annotation} timepointsInRange={timepointsInRange} />;
  }

  return <AnnotationSingleRenderer annotation={annotation} timepointsInRange={timepointsInRange} />;
};

const AnnotationRangeRenderer = ({
  annotation,
  timepointsInRange,
}: {
  annotation: Annotation;
  timepointsInRange: Timepoint[];
}) => {
  // TODO
  return null;
};

const AnnotationSingleRenderer = ({
  annotation,
  timepointsInRange,
}: {
  annotation: Annotation;
  timepointsInRange: Timepoint[];
}) => {
  const [right, setRight] = useState<number>(0);
  const styles = useStyles2(getStyles);
  const ref = useRef<HTMLDivElement>(null);

  const calculatePosition = useCallback(() => {
    const timepointStartIndex = timepointsInRange.findIndex(
      (timepoint) => timepoint.adjustedTime === annotation.timepointStart.adjustedTime
    );
    const timepointList = document.getElementById(TIMEPOINT_LIST_ID);
    const timepointListChildren = timepointList?.children;

    if (timepointListChildren) {
      const listRight = timepointList.getBoundingClientRect().right;
      const timepoint = timepointListChildren[timepointStartIndex];

      if (timepoint) {
        const timepointRect = timepoint.getBoundingClientRect();
        setRight(listRight - timepointRect.right - 1);
      }
    }
  }, [annotation.timepointStart.adjustedTime, timepointsInRange]);

  useEffect(() => {
    calculatePosition();
  }, [timepointsInRange, calculatePosition]);

  useResizeObserver({
    // @ts-expect-error https://github.com/juliencrn/usehooks-ts/issues/663
    ref,
    onResize: () => {
      calculatePosition();
    },
  });

  return (
    <div ref={ref} className={styles.container} style={{ right }}>
      <div className={styles.label}>{annotation.checkEvent.label}</div>
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => {
  const color = theme.visualization.getColorByName(`yellow`);

  return {
    container: css`
      position: absolute;
      bottom: 0;
      transform: translateX(calc(-1 * ${TIMEPOINT_SIZE}px / 2));
      height: 80%;
      width: 1px;
      border: 1px dashed ${color};
    `,
    label: css`
      position: absolute;
      bottom: 100%;
      padding: ${theme.spacing(1)};
      background-color: ${theme.colors.background.primary};
      border: 1px dashed ${color};
      transform: translateX(calc(-50%));
      left: 50%;
    `,
  };
};
