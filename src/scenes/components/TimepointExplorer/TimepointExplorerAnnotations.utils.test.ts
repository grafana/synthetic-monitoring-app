import { CheckEventType } from 'scenes/components/TimepointExplorer/TimepointExplorer.types';
import { buildTimepoints } from 'scenes/components/TimepointExplorer/TimepointExplorer.utils';
import {
  AnnotationWithIndices,
  getCheckEventsInRange,
  getClosestTimepointsToCheckEvent,
} from 'scenes/components/TimepointExplorer/TimepointExplorerAnnotations.utils';

describe('getCheckEventsInRange', () => {
  it('should return the check events that are in the range', () => {
    const checkEvents = [{ from: 30000, to: 30000, label: CheckEventType.CHECK_CREATED, color: 'blue' }];
    const timepointsInRange = buildTimepoints({
      checkConfigs: [{ frequency: 10000, from: 0, to: 100000 }],
      from: 30000,
      to: 100000,
    });

    const result = getCheckEventsInRange(checkEvents, timepointsInRange);
    expect(result).toEqual(checkEvents);
  });

  it('should not return the check events that do not intersect the range', () => {
    const checkEvents = [
      { from: 10000, to: 15000, label: CheckEventType.CHECK_CREATED, color: 'blue' }, // completely before
      { from: 120000, to: 130000, label: CheckEventType.CHECK_UPDATED, color: 'blue' }, // completely after
    ];
    const timepointsInRange = buildTimepoints({
      checkConfigs: [{ frequency: 10000, from: 0, to: 100000 }],
      from: 30000,
      to: 100000,
    });

    const result = getCheckEventsInRange(checkEvents, timepointsInRange);
    expect(result).toEqual([]);
  });

  it('should return partially overlapping range annotations', () => {
    const checkEvents = [
      { from: 20000, to: 35000, label: CheckEventType.CHECK_CREATED, color: 'blue' }, // starts before, ends in range
      { from: 90000, to: 120000, label: CheckEventType.CHECK_UPDATED, color: 'blue' }, // starts in range, ends after
      { from: 10000, to: 120000, label: CheckEventType.CHECK_UPDATED, color: 'blue' }, // spans entire range
    ];
    const timepointsInRange = buildTimepoints({
      checkConfigs: [{ frequency: 10000, from: 0, to: 100000 }],
      from: 30000,
      to: 100000,
    });

    const result = getCheckEventsInRange(checkEvents, timepointsInRange);
    expect(result).toHaveLength(3);
    expect(result).toEqual(checkEvents);
  });
});

describe('getClosestTimepointsToCheckEvent', () => {
  it('should return the closest timepoints to the check event', () => {
    const checkEvents = [{ from: 30000, to: 40001, label: CheckEventType.CHECK_CREATED, color: 'blue' }];
    const timepointsInRange = buildTimepoints({
      checkConfigs: [{ frequency: 10000, from: 0, to: 100000 }],
      from: 30000,
      to: 100000,
    });

    const result = getClosestTimepointsToCheckEvent(checkEvents, timepointsInRange);
    const match: AnnotationWithIndices = {
      checkEvent: checkEvents[0],
      isClippedStart: false,
      isClippedEnd: false,
      isInstant: false,
      visibleStartIndex: 0,
      visibleEndIndex: 1,
    };

    expect(result).toMatchObject([match]);
  });

  it('should handle range annotations that start before visible range', () => {
    const checkEvents = [{ from: 10000, to: 40001, label: CheckEventType.CHECK_UPDATED, color: 'blue' }];
    const timepointsInRange = buildTimepoints({
      checkConfigs: [{ frequency: 10000, from: 0, to: 100000 }],
      from: 30000,
      to: 100000,
    });

    const result = getClosestTimepointsToCheckEvent(checkEvents, timepointsInRange);
    const match: AnnotationWithIndices = {
      checkEvent: checkEvents[0],
      isClippedStart: true,
      isClippedEnd: false,
      isInstant: false,
      visibleStartIndex: 0,
      visibleEndIndex: 1,
    };

    expect(result).toMatchObject([match]);
  });

  it('should handle range annotations that end after visible range', () => {
    const checkEvents = [{ from: 30000, to: 150000, label: CheckEventType.CHECK_UPDATED, color: 'blue' }];
    const timepointsInRange = buildTimepoints({
      checkConfigs: [{ frequency: 10000, from: 0, to: 100000 }],
      from: 30000,
      to: 100000,
    });

    const result = getClosestTimepointsToCheckEvent(checkEvents, timepointsInRange);
    const match: AnnotationWithIndices = {
      checkEvent: checkEvents[0],
      isClippedStart: false,
      isClippedEnd: true,
      isInstant: false,
      visibleStartIndex: 0,
      visibleEndIndex: timepointsInRange.length - 1,
    };

    expect(result[0]).toMatchObject(match);
  });

  it('should handle range annotations that span completely across visible range', () => {
    const checkEvents = [{ from: 10000, to: 150000, label: CheckEventType.CHECK_UPDATED, color: 'blue' }];
    const timepointsInRange = buildTimepoints({
      checkConfigs: [{ frequency: 10000, from: 0, to: 100000 }],
      from: 30000,
      to: 100000,
    });

    const result = getClosestTimepointsToCheckEvent(checkEvents, timepointsInRange);
    const match: AnnotationWithIndices = {
      checkEvent: checkEvents[0],
      isClippedStart: true,
      isClippedEnd: true,
      isInstant: false,
      visibleStartIndex: 0,
      visibleEndIndex: timepointsInRange.length - 1,
    };

    expect(result).toMatchObject([match]);
  });
});
