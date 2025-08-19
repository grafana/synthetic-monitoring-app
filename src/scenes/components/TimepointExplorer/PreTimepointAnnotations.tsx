import React from 'react';

import {
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
  const { check, miniMapCurrentPage, miniMapPages, isCheckCreationWithinTimerange } = useTimepointExplorerContext();
  const checkCreation = check.created;
  const isFirstPage = miniMapCurrentPage === miniMapPages.length - 1;

  if (!(isBeginningSection && isFirstPage) || !checkCreation) {
    return null;
  }

  return (
    <>
      {isCheckCreationWithinTimerange ? (
        <CheckCreationAnnotation
          checkCreation={checkCreation}
          showLabels={showLabels}
          displayWidth={displayWidth}
          parentWidth={parentWidth}
          timepointsInRange={timepointsInRange}
        />
      ) : (
        <OutOfRangeAnnotation
          displayWidth={displayWidth}
          parentWidth={parentWidth}
          showLabels={showLabels}
          timepointsInRange={timepointsInRange}
          triggerHeight={triggerHeight}
        />
      )}
    </>
  );
};

interface CheckCreationAnnotationProps {
  checkCreation: number;
  showLabels?: boolean;
  displayWidth: number;
  parentWidth: number;
  timepointsInRange: StatelessTimepoint[];
}

const CheckCreationAnnotation = ({
  checkCreation,
  showLabels,
  displayWidth,
  parentWidth,
  timepointsInRange,
}: CheckCreationAnnotationProps) => {
  return (
    <TimepointInstantAnnotation
      annotation={{
        checkEvent: {
          label: CheckEventType.CHECK_CREATED,
          from: Math.round(checkCreation * 1000),
          to: Math.round(checkCreation * 1000),
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
      showLabels={showLabels}
      timepointsInRange={timepointsInRange}
    />
  );
};

interface OutOfRangeAnnotationProps {
  displayWidth: number;
  parentWidth: number;
  showLabels?: boolean;
  timepointsInRange: StatelessTimepoint[];
  triggerHeight: number;
}

const OutOfRangeAnnotation = ({
  displayWidth,
  parentWidth,
  showLabels,
  timepointsInRange,
  triggerHeight,
}: OutOfRangeAnnotationProps) => {
  const { isLogsRetentionPeriodWithinTimerange, timepointsDisplayCount } = useTimepointExplorerContext();
  const visibleEndIndex = -1;
  const visibleStartIndex = visibleEndIndex - timepointsDisplayCount + timepointsInRange.length + 1;

  const label = isLogsRetentionPeriodWithinTimerange
    ? CheckEventType.OUT_OF_RETENTION_PERIOD
    : CheckEventType.OUT_OF_TIMERANGE;
  const color = isLogsRetentionPeriodWithinTimerange
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
      showLabels={showLabels}
      timepointsInRange={timepointsInRange}
      triggerHeight={triggerHeight}
    />
  );
};
