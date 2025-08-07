import { doesTimeRangeCrossDays } from 'scenes/components/TimepointExplorer/XAxis.utils';

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
