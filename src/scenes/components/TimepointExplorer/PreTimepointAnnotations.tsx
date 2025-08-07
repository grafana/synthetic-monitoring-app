import React from 'react';

import { useTimepointExplorerContext } from 'scenes/components/TimepointExplorer/TimepointExplorer.context';
import { CheckEventType, StatelessTimepoint } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import { TimepointInstantAnnotation } from 'scenes/components/TimepointExplorer/TimepointInstantAnnotation';
import { TimepointRangeAnnotation } from 'scenes/components/TimepointExplorer/TimepointRangeAnnotation';

interface PreTimepointAnnotationsProps {
  isBeginningSection: boolean;
  displayLabels?: boolean;
  displayWidth: number;
  timepointsInRange: StatelessTimepoint[];
  parentWidth: number;
}

export const PreTimepointAnnotations = ({
  isBeginningSection,
  displayLabels,
  displayWidth,
  timepointsInRange,
  parentWidth,
}: PreTimepointAnnotationsProps) => {
  const { check, miniMapCurrentPage, miniMapPages, timepoints } = useTimepointExplorerContext();
  const checkCreation = check.created;
  const isFirstPage = miniMapCurrentPage === miniMapPages.length - 1;

  if (!(isBeginningSection && isFirstPage) || !checkCreation) {
    return null;
  }

  const isCheckCreationWithinTimerange = getIsCheckCreationWithinTimerange(checkCreation, timepoints);

  return (
    <>
      {isCheckCreationWithinTimerange ? (
        <CheckCreationAnnotation
          checkCreation={checkCreation}
          displayLabels={displayLabels}
          displayWidth={displayWidth}
          parentWidth={parentWidth}
          timepointsInRange={timepointsInRange}
        />
      ) : (
        <OutOfRangeAnnotation
          displayLabels={displayLabels}
          displayWidth={displayWidth}
          parentWidth={parentWidth}
          timepointsInRange={timepointsInRange}
        />
      )}
    </>
  );
};

interface CheckCreationAnnotationProps {
  checkCreation: number;
  displayLabels?: boolean;
  displayWidth: number;
  parentWidth: number;
  timepointsInRange: StatelessTimepoint[];
}

const CheckCreationAnnotation = ({
  checkCreation,
  displayLabels,
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
          color: 'blue',
        },
        isClippedStart: false,
        isClippedEnd: false,
        isInstant: true,
        visibleStartIndex: -1,
        visibleEndIndex: -1,
      }}
      displayLabels={displayLabels}
      displayWidth={displayWidth}
      parentWidth={parentWidth}
      timepointsInRange={timepointsInRange}
    />
  );
};

interface OutOfRangeAnnotationProps {
  displayLabels?: boolean;
  displayWidth: number;
  parentWidth: number;
  timepointsInRange: StatelessTimepoint[];
}

const OutOfRangeAnnotation = ({
  displayLabels,
  displayWidth,
  parentWidth,
  timepointsInRange,
}: OutOfRangeAnnotationProps) => {
  const { timepointsDisplayCount } = useTimepointExplorerContext();
  const visibleEndIndex = -1;
  const visibleStartIndex = visibleEndIndex - timepointsDisplayCount + timepointsInRange.length + 1;

  return (
    <TimepointRangeAnnotation
      annotation={{
        checkEvent: {
          label: CheckEventType.OUT_OF_TIMERANGE,
          from: new Date().getTime(),
          to: new Date().getTime(),
          color: 'gray',
        },
        isClippedStart: true,
        isClippedEnd: false,
        isInstant: false,
        visibleStartIndex,
        visibleEndIndex,
      }}
      displayLabels={displayLabels}
      displayWidth={displayWidth}
      parentWidth={parentWidth}
      timepointsInRange={timepointsInRange}
    />
  );
};

function getIsCheckCreationWithinTimerange(checkCreation: number, timepoints: StatelessTimepoint[]) {
  const checkCreationDate = Math.round(checkCreation * 1000);
  const { adjustedTime, timepointDuration } = timepoints[0];

  return checkCreationDate >= adjustedTime - timepointDuration;
}
