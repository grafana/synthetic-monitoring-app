import React from 'react';
import { useTimeRange } from '@grafana/scenes-react';

import {
  ANNOTATION_COLOR_BEFORE_CREATION,
  ANNOTATION_COLOR_CHECK_CREATED,
  ANNOTATION_COLOR_OUT_OF_RETENTION_PERIOD,
  ANNOTATION_COLOR_OUT_OF_TIMERANGE,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.constants';
import { useTimepointExplorerContext } from 'scenes/components/TimepointExplorer/TimepointExplorer.context';
import { CheckEventType, StatelessTimepoint } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import { TimepointInstantAnnotation } from 'scenes/components/TimepointExplorer/TimepointInstantAnnotation';
import { TimepointRangeAnnotation } from 'scenes/components/TimepointExplorer/TimepointRangeAnnotation';

interface PreTimepointAnnotationsProps {
  displayWidth: number;
  isBeginningSection: boolean;
  parentWidth: number;
  showLabels?: boolean;
  timepointsInRange: StatelessTimepoint[];
  triggerHeight: number;
}

export const PreTimepointAnnotations = ({
  displayWidth,
  isBeginningSection,
  parentWidth,
  showLabels,
  triggerHeight,
  timepointsInRange,
}: PreTimepointAnnotationsProps) => {
  const { check, isCheckCreationWithinTimeRange, miniMapCurrentPage, miniMapPages, renderingStrategy } =
    useTimepointExplorerContext();
  const checkCreation = Math.round(check.created! * 1000);
  const isFirstPage = miniMapCurrentPage === miniMapPages.length - 1;

  if (!(isBeginningSection && isFirstPage) || !checkCreation) {
    return null;
  }

  if (isCheckCreationWithinTimeRange) {
    return (
      <CheckCreationAnnotation
        checkCreation={checkCreation}
        showLabels={showLabels}
        displayWidth={displayWidth}
        parentWidth={parentWidth}
        renderingStrategy={renderingStrategy}
        timepointsInRange={timepointsInRange}
        triggerHeight={triggerHeight}
      />
    );
  }

  if (renderingStrategy === 'end') {
    return (
      <OutOfRangeAnnotation
        checkCreation={checkCreation}
        displayWidth={displayWidth}
        parentWidth={parentWidth}
        showLabels={showLabels}
        timepointsInRange={timepointsInRange}
        triggerHeight={triggerHeight}
      />
    );
  }

  return null;
};

interface CheckCreationAnnotationProps {
  checkCreation: number;
  showLabels?: boolean;
  displayWidth: number;
  parentWidth: number;
  renderingStrategy: 'start' | 'end';
  timepointsInRange: StatelessTimepoint[];
  triggerHeight: number;
}

const CheckCreationAnnotation = ({
  checkCreation,
  showLabels,
  displayWidth,
  parentWidth,
  renderingStrategy,
  timepointsInRange,
  triggerHeight,
}: CheckCreationAnnotationProps) => {
  return (
    <TimepointInstantAnnotation
      annotation={{
        checkEvent: {
          label: CheckEventType.CHECK_CREATED,
          from: checkCreation,
          to: checkCreation,
          color: ANNOTATION_COLOR_CHECK_CREATED,
        },
        isClippedStart: false,
        isClippedEnd: false,
        isInstant: true,
        visibleStartIndex: -1,
        visibleEndIndex: -1,
      }}
      displayWidth={displayWidth}
      parentWidth={parentWidth}
      renderingStrategy={renderingStrategy}
      showLabels={showLabels}
      timepointsInRange={timepointsInRange}
      triggerHeight={triggerHeight}
    />
  );
};

interface OutOfRangeAnnotationProps {
  checkCreation: number;
  displayWidth: number;
  parentWidth: number;
  showLabels?: boolean;
  timepointsInRange: StatelessTimepoint[];
  triggerHeight: number;
}

const OutOfRangeAnnotation = ({
  checkCreation,
  displayWidth,
  parentWidth,
  showLabels,
  timepointsInRange,
  triggerHeight,
}: OutOfRangeAnnotationProps) => {
  const [timeRange] = useTimeRange();
  const { isLogsRetentionPeriodWithinTimerange, timepointsDisplayCount } = useTimepointExplorerContext();
  const visibleEndIndex = -1;
  const visibleStartIndex = visibleEndIndex - timepointsDisplayCount + timepointsInRange.length + 1;
  const isCheckCreationAfterTo = checkCreation > timeRange.to.valueOf();

  const label = isCheckCreationAfterTo
    ? CheckEventType.BEFORE_CREATION
    : isLogsRetentionPeriodWithinTimerange
    ? CheckEventType.OUT_OF_RETENTION_PERIOD
    : CheckEventType.OUT_OF_TIMERANGE;

  const color = isCheckCreationAfterTo
    ? ANNOTATION_COLOR_BEFORE_CREATION
    : isLogsRetentionPeriodWithinTimerange
    ? ANNOTATION_COLOR_OUT_OF_RETENTION_PERIOD
    : ANNOTATION_COLOR_OUT_OF_TIMERANGE;

  return (
    <TimepointRangeAnnotation
      annotation={{
        checkEvent: {
          label,
          from: null,
          to: null,
          color,
        },
        isClippedStart: true,
        isClippedEnd: false,
        isInstant: false,
        visibleStartIndex,
        visibleEndIndex,
      }}
      displayWidth={displayWidth}
      parentWidth={parentWidth}
      renderingStrategy={`end`}
      showLabels={showLabels}
      timepointsInRange={timepointsInRange}
      triggerHeight={triggerHeight}
    />
  );
};
