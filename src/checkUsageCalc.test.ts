import { UsageValues } from 'types';
import { ONE_SECOND_IN_MS } from 'utils.constants';

import { calculateMultiHTTPUsage, calculateUsage, getTotalChecksPerMonth, getTotalChecksPerPeriod } from './checkUsageCalc';

describe('checkUsageCalc', () => {
  describe('getTotalChecksPerMonth', () => {
    it('should calculate total checks per month correctly when probeCount is 1', () => {
      const probeCount = 1;
      const frequency = 300 * ONE_SECOND_IN_MS;
      const result = getTotalChecksPerMonth(probeCount, frequency);
      expect(result).toBe(8928);
    });

    it('should calculate total checks per month correctly when probeCount is bigger than 1', () => {
      const probeCount = 2;
      const frequency = 300 * ONE_SECOND_IN_MS;
      const result = getTotalChecksPerMonth(probeCount, frequency);
      expect(result).toBe(17856);
    });

    it('should return 0 checks per month when probe count is 0', () => {
      const probeCount = 0;
      const frequency = 300 * ONE_SECOND_IN_MS;
      const result = getTotalChecksPerMonth(probeCount, frequency);
      expect(result).toBe(0);
    });
  });

  describe('getTotalChecksPerPeriod', () => {
    it('should calculate correct executions for the reported issue case (6m frequency, 10m period)', () => {
      const probeCount = 1;
      const frequency = 6 * 60 * ONE_SECOND_IN_MS; // 6 minutes
      const period = 10 * 60 * ONE_SECOND_IN_MS; // 10 minutes
      const result = getTotalChecksPerPeriod(probeCount, frequency, period);
      // floor(10m / 6m) * 1 = floor(1.667) * 1 = 1
      expect(result).toBe(1);
    });

    it('should calculate correct executions when period is exactly divisible by frequency', () => {
      const probeCount = 1;
      const frequency = 5 * 60 * ONE_SECOND_IN_MS; // 5 minutes
      const period = 10 * 60 * ONE_SECOND_IN_MS; // 10 minutes
      const result = getTotalChecksPerPeriod(probeCount, frequency, period);
      // floor(10m / 5m) * 1 = floor(2) * 1 = 2
      expect(result).toBe(2);
    });

    it('should calculate correct executions with multiple probes', () => {
      const probeCount = 3;
      const frequency = 2 * 60 * ONE_SECOND_IN_MS; // 2 minutes
      const period = 5 * 60 * ONE_SECOND_IN_MS; // 5 minutes
      const result = getTotalChecksPerPeriod(probeCount, frequency, period);
      // floor(5m / 2m) * 3 = floor(2.5) * 3 = 2 * 3 = 6
      expect(result).toBe(6);
    });

    it('should return 0 when period is shorter than frequency', () => {
      const probeCount = 1;
      const frequency = 10 * 60 * ONE_SECOND_IN_MS; // 10 minutes
      const period = 5 * 60 * ONE_SECOND_IN_MS; // 5 minutes
      const result = getTotalChecksPerPeriod(probeCount, frequency, period);
      // floor(5m / 10m) * 1 = floor(0.5) * 1 = 0
      expect(result).toBe(0);
    });

    it('should return 0 when probe count is 0', () => {
      const probeCount = 0;
      const frequency = 5 * 60 * ONE_SECOND_IN_MS;
      const period = 10 * 60 * ONE_SECOND_IN_MS;
      const result = getTotalChecksPerPeriod(probeCount, frequency, period);
      expect(result).toBe(0);
    });
  });

  describe('calculateUsage', () => {
    it('should calculate usage correctly', () => {
      const params = {
        assertionCount: 1,
        probeCount: 1,
        frequency: 300 * ONE_SECOND_IN_MS,
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
        frequency: 300 * ONE_SECOND_IN_MS,
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
        frequency: 300 * ONE_SECOND_IN_MS,
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
        frequency: 300 * ONE_SECOND_IN_MS,
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
