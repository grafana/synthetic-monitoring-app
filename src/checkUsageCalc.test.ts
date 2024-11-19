import { UsageValues } from 'types';

import { calculateMultiHTTPUsage, calculateUsage, getTotalChecksPerMonth } from './checkUsageCalc';

describe('checkUsageCalc', () => {
  describe('getTotalChecksPerMonth', () => {
    it('should calculate total checks per month correctly when probeCount is 1', () => {
      const probeCount = 1;
      const frequencySeconds = 300;
      const result = getTotalChecksPerMonth(probeCount, frequencySeconds);
      expect(result).toBe(8928);
    });

    it('should calculate total checks per month correctly when probeCount is bigger than 1', () => {
        const probeCount = 2;
        const frequencySeconds = 300;
        const result = getTotalChecksPerMonth(probeCount, frequencySeconds);
        expect(result).toBe(17856);
      });

    it('should return 0 checks per month when probe count is 0', () => {
      const probeCount = 0;
      const frequencySeconds = 300;
      const result = getTotalChecksPerMonth(probeCount, frequencySeconds);
      expect(result).toBe(0);
    });
  });

  describe('calculateUsage', () => {
    it('should calculate usage correctly', () => {
      const params = {
        assertionCount: 1,
        probeCount: 1,
        frequencySeconds: 300,
        seriesPerProbe: 22,
      };
      const expected: UsageValues = {
        checksPerMonth: 8928,
        activeSeries: 22,
        logsGbPerMonth: 0.01,
        dpm: 22,
      };
      const result = calculateUsage(params);
      expect(result).toEqual(expected);
    });

    it('should return 0 values when probe count is 0', () => {
      const params = {
        assertionCount: 1,
        probeCount: 0,
        frequencySeconds: 300,
        seriesPerProbe: 22,
      };
      const expected: UsageValues = {
        checksPerMonth: 0,
        activeSeries: 0,
        logsGbPerMonth: 0,
        dpm: 0,
      };
      const result = calculateUsage(params);
      expect(result).toEqual(expected);
    });
  });

  describe('calculateMultiHTTPUsage', () => {
    it('should calculate multi HTTP usage correctly', () => {
      const params = {
        assertionCount: 1,
        probeCount: 1,
        frequencySeconds: 300,
        seriesPerProbe: 33,
      };
      const expected: UsageValues = {
        checksPerMonth: 8928,
        activeSeries: 33,
        logsGbPerMonth: 0.013847328,
        dpm: 33,
      };
      const result = calculateMultiHTTPUsage(params);
      expect(result).toEqual(expected);
    });

    it('should return 0 values when probe count is 0', () => {
      const params = {
        assertionCount: 1,
        probeCount: 0,
        frequencySeconds: 300,
        seriesPerProbe: 33,
      };
      const expected: UsageValues = {
        checksPerMonth: 0,
        activeSeries: 0,
        logsGbPerMonth: 0,
        dpm: 0,
      };
      const result = calculateMultiHTTPUsage(params);
      expect(result).toEqual(expected);
    });
  });
});
