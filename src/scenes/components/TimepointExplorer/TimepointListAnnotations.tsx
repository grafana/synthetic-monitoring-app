import React, { useLayoutEffect, useRef, useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { useTimeRange } from '@grafana/scenes-react';
import { useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { useResizeObserver } from 'usehooks-ts';

import { AnnotationRange } from 'scenes/components/TimepointExplorer/AnnotationRange';
import { AnnotationRender } from 'scenes/components/TimepointExplorer/AnnotationRenderer';
import { THEME_UNIT, TIMEPOINT_LIST_ID } from 'scenes/components/TimepointExplorer/TimepointExplorer.constants';
import { Annotation, CheckEventType, Timepoint } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';

export const TimepointListAnnotations = ({
  annotations,
  timepointsInRange,
}: {
  annotations: Annotation[];
  timepointsInRange: Timepoint[];
}) => {
  const styles = useStyles2(getStyles);
  const timepointsInRangeAdjustedTimes = timepointsInRange.map((timepoint) => timepoint.adjustedTime);

  const annotationsToRender = annotations.filter((annotation) => {
    return timepointsInRangeAdjustedTimes.some((timepoint) => {
      return [annotation.timepointStart.adjustedTime, annotation.timepointEnd.adjustedTime].includes(timepoint);
    });
  });

  return (
    <div className={styles.container}>
      <OutofSelectedTimeRange timepointsInRange={timepointsInRange} annotationsToRender={annotationsToRender} />
      {annotationsToRender.map((annotation) => (
        <AnnotationRender
          annotation={annotation}
          key={annotation.checkEvent.label}
          timepointsInRange={timepointsInRange}
        />
      ))}
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
  `,
});

interface OutofSelectedTimeRangeProps {
  annotationsToRender: Annotation[];
  timepointsInRange: Timepoint[];
}

const OutofSelectedTimeRange = ({ annotationsToRender, timepointsInRange }: OutofSelectedTimeRangeProps) => {
  const [timeRange] = useTimeRange();
  const [width, setWidth] = useState<number>(0);
  const ref = useRef<HTMLDivElement>(null);
  const firstTimepointStart = timepointsInRange[0]?.adjustedTime;
  const isOutOfRange = firstTimepointStart > timeRange.from.valueOf();
  const isActuallyStartOfRange = annotationsToRender.some(
    (annotation) => annotation.checkEvent.label === CheckEventType.CHECK_CREATED
  );

  useLayoutEffect(() => {
    setWidth(calculateWidth());
  }, [timepointsInRange]);

  useResizeObserver({
    // @ts-expect-error https://github.com/juliencrn/usehooks-ts/issues/663
    ref,
    onResize: () => {
      setWidth(calculateWidth());
    },
  });

  if (isOutOfRange && !isActuallyStartOfRange) {
    return (
      <div
        ref={ref}
        style={{
          zIndex: 1000,
          width,
          height: '100%',
        }}
      >
        {width > 150 && <AnnotationRange title={`Out of selected time range`} />}
      </div>
    );
  }

  return null;
};

function calculateWidth() {
  const edgeOfRef = document.getElementById(TIMEPOINT_LIST_ID);
  const firstTimepoint = edgeOfRef?.firstChild;

  if (firstTimepoint instanceof HTMLElement && edgeOfRef instanceof HTMLElement) {
    const firstTimepointRect = firstTimepoint.getBoundingClientRect();
    const edgeOfRefRect = edgeOfRef.getBoundingClientRect();

    return firstTimepointRect.left - edgeOfRefRect.left - THEME_UNIT;
  }

  return 0;
}
