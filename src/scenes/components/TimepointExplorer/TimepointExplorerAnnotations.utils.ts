import {
  CheckEvent,
  StatelessTimepoint,
  UnixTimestamp,
} from 'scenes/components/TimepointExplorer/TimepointExplorer.types';

export function getCheckEventsInRange(checkEvents: CheckEvent[], timepointsInRange: StatelessTimepoint[]) {
  const fromEntry = timepointsInRange[0];
  const toEntry = timepointsInRange[timepointsInRange.length - 1];

  const rangeFrom = fromEntry.adjustedTime;
  const rangeTo = toEntry.adjustedTime + toEntry.timepointDuration;

  // Include annotations that intersect with the visible range (not just fully contained)
  const inRangeCheckEvents = checkEvents.filter((checkEvent) => {
    // Annotation intersects if it starts before range ends AND ends after range starts
    return checkEvent.from <= rangeTo && checkEvent.to >= rangeFrom;
  });

  return inRangeCheckEvents;
}

export type AnnotationWithIndices = {
  checkEvent: CheckEvent;
  isClippedStart: boolean;
  isClippedEnd: boolean;
  isInstant: boolean;
  visibleStartIndex: number;
  visibleEndIndex: number;
};

export function getClosestTimepointsToCheckEvent(
  checkEvents: CheckEvent[],
  timepointsInRange: StatelessTimepoint[]
): AnnotationWithIndices[] {
  return checkEvents.map((checkEvent) => {
    // Find actual timepoint indices for the annotation start/end
    const startingIndex = timepointsInRange.findIndex((timepoint) => isInTimepoint(timepoint, checkEvent.from));
    const endingIndex = timepointsInRange.findIndex((timepoint) => isInTimepoint(timepoint, checkEvent.to));

    // Calculate visible indices (clipped to current range)
    const visibleStartIndex = Math.max(0, startingIndex === -1 ? 0 : startingIndex);
    const visibleEndIndex = Math.min(
      timepointsInRange.length - 1,
      endingIndex === -1 ? timepointsInRange.length - 1 : endingIndex
    );

    // Track if annotation extends beyond visible range
    const isClippedStart = startingIndex === -1 || checkEvent.from < timepointsInRange[0].adjustedTime;
    const isClippedEnd =
      endingIndex === -1 ||
      checkEvent.to >
        timepointsInRange[timepointsInRange.length - 1].adjustedTime +
          timepointsInRange[timepointsInRange.length - 1].timepointDuration;

    return {
      isClippedStart,
      isClippedEnd,
      isInstant: checkEvent.to === checkEvent.from,
      visibleStartIndex,
      visibleEndIndex,
      checkEvent,
    };
  });
}

export function isInTimepoint(timepoint: StatelessTimepoint, unixtime: UnixTimestamp) {
  const timepointStart = timepoint.adjustedTime;
  const timepointEnd = timepoint.adjustedTime + timepoint.timepointDuration;

  if (unixtime >= timepointStart && unixtime <= timepointEnd) {
    return true;
  }

  return false;
}
