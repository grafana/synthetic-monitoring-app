import { createPerCheckLogsForTimeRange } from 'test/db/checkLogs';

import { filterProbes } from './TimepointViewer.utils';

describe(`filterProbes`, () => {
  it(`should filter probes based on timepoint range`, () => {
    // Define a timepoint
    const timepoint = {
      adjustedTime: 1000000,
      timepointDuration: 60000, // 1 minute duration
      probes: [],
      uptimeValue: -1 as const,
      frequency: 60000,
      index: 0,
      maxProbeDuration: 30000,
    };

    // Create test data with some checks within range and some outside
    const testData = createPerCheckLogsForTimeRange(2, timepoint);

    // Run the filter
    const result = filterProbes(testData, timepoint);

    // Verify we get the same number of probes
    expect(result).toHaveLength(2);

    // Verify that each probe has been processed
    result.forEach((probe, index) => {
      expect(probe.probe).toBe(`probe${index + 1}`);
      expect(probe.checks).toBeInstanceOf(Array);

      // The factory creates 2 checks per probe - one in range, one out of range
      // So after filtering, we should have 1 check per probe
      expect(probe.checks).toHaveLength(1);

      // Verify the remaining check is within the timepoint range
      const remainingCheck = probe.checks[0];
      const lastLog = remainingCheck[remainingCheck.length - 1];
      const timepointStart = timepoint.adjustedTime - timepoint.timepointDuration;
      const timepointEnd = timepoint.adjustedTime;

      expect(lastLog.Time).toBeGreaterThanOrEqual(timepointStart);
      expect(lastLog.Time).toBeLessThanOrEqual(timepointEnd);
    });
  });
});
