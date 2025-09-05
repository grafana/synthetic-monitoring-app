import { buildTimepoints } from 'scenes/components/TimepointExplorer/TimepointExplorer.utils';
import { buildXAxisPoints, doesTimeRangeCrossDays } from 'scenes/components/TimepointExplorer/XAxis.utils';

describe('doesTimeRangeCrossDays', () => {
  describe('it returns true when', () => {
    it('the time is 1 second apart', () => {
      expect(doesTimeRangeCrossDays(new Date('2025-01-01T23:59:59Z'), new Date('2025-01-02T00:00:00Z'))).toBe(true);
    });

    it('the time is 3 hours apart', () => {
      expect(doesTimeRangeCrossDays(new Date('2025-01-01T21:00:00Z'), new Date('2025-01-02T:00:00Z'))).toBe(true);
    });

    it('the time is 24 hours apart', () => {
      expect(doesTimeRangeCrossDays(new Date('2021-01-01T00:00:00Z'), new Date('2021-01-02T00:00:00Z'))).toBe(true);
    });

    it(`the time is 7 days apart`, () => {
      expect(doesTimeRangeCrossDays(new Date('2025-01-01T00:00:00Z'), new Date('2025-01-08T00:00:00Z'))).toBe(true);
    });

    it(`the time is 14 days apart`, () => {
      expect(doesTimeRangeCrossDays(new Date('2025-01-01T00:00:00Z'), new Date('2025-01-15T00:00:00Z'))).toBe(true);
    });

    it(`the time is 30 days apart`, () => {
      expect(doesTimeRangeCrossDays(new Date('2025-01-01T00:00:00Z'), new Date('2025-02-01T00:00:00Z'))).toBe(true);
    });

    it(`the time is one year apart`, () => {
      expect(doesTimeRangeCrossDays(new Date('2025-01-01T00:00:00Z'), new Date('2026-01-01T00:00:00Z'))).toBe(true);
    });

    it(`the time is 10 years apart`, () => {
      expect(doesTimeRangeCrossDays(new Date('2025-01-01T00:00:00Z'), new Date('2035-01-01T00:00:00Z'))).toBe(true);
    });
  });

  describe('it returns false when', () => {
    it('the time is 1 second apart', () => {
      expect(doesTimeRangeCrossDays(new Date('2025-01-01T00:00:00Z'), new Date('2021-01-02T00:00:00Z'))).toBe(true);
    });

    it('the time is 3 hours apart', () => {
      expect(doesTimeRangeCrossDays(new Date('2025-01-01T21:00:00Z'), new Date('2025-01-02T:00:00Z'))).toBe(true);
    });

    it('the time is 23 59 minutes and 59 seconds apart', () => {
      expect(doesTimeRangeCrossDays(new Date('2025-01-01T00:00:00Z'), new Date('2025-01-01T23:59:59Z'))).toBe(false);
    });
  });
});

describe('buildXAxisPoints', () => {
  it('should return 1 xAxis point when there is 1 timepoint', () => {
    const timepoints = buildTimepoints({
      checkConfigs: [{ frequency: 1, from: 0, to: 1 }],
    });

    const result = buildXAxisPoints({ timepoints, crossesDays: false, timepointWidth: 20 });
    expect(result.length).toBe(1);
  });

  it('should return 1 xAxis point when there are 2 timepoints with a width of 20px', () => {
    const timepoints = buildTimepoints({
      checkConfigs: [{ frequency: 1, from: 0, to: 2 }],
    });

    const result = buildXAxisPoints({ timepoints, crossesDays: false, timepointWidth: 20 });
    expect(result.length).toBe(1);
  });

  it('should return 2 xAxis points when there are 10 timepoints with a width of 20px', () => {
    const timepoints = buildTimepoints({
      checkConfigs: [{ frequency: 1, from: 0, to: 10 }],
    });

    const result = buildXAxisPoints({ timepoints, crossesDays: false, timepointWidth: 20 });
    expect(result.length).toBe(2);
  });

  it('should return 3 xAxis points when there are 20 ten timepoints with a width of 20px', () => {
    const timepoints = buildTimepoints({
      checkConfigs: [{ frequency: 1, from: 0, to: 20 }],
    });

    const result = buildXAxisPoints({ timepoints, crossesDays: true, timepointWidth: 20 });
    expect(result.length).toBe(3);
  });

  it(`should display the correct labels when crossesDays is true`, () => {
    const from = new Date('2025-01-01T00:00:00Z');
    const fromTime = from.getTime();
    const frequency = 60000;
    const toTime = fromTime + frequency * 20;

    const timepoints = buildTimepoints({
      checkConfigs: [{ frequency, from: fromTime, to: toTime }],
    });

    const result = buildXAxisPoints({ timepoints, crossesDays: true, timepointWidth: 20 });
    expect(result[0].label).toBe(`1/1, 00:00:00`);
  });

  it(`should display the correct labels when crossesDays is false`, () => {
    const from = new Date('2025-01-01T00:00:00Z');
    const fromTime = from.getTime();
    const frequency = 60000;
    const toTime = fromTime + frequency * 20;

    const timepoints = buildTimepoints({
      checkConfigs: [{ frequency, from: fromTime, to: toTime }],
    });

    const result = buildXAxisPoints({ timepoints, crossesDays: false, timepointWidth: 20 });
    expect(result[0].label).toBe(`00:00:00`);
  });
});
