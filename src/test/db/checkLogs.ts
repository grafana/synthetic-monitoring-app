import { faker } from '@faker-js/faker';
import { MSG_STRINGS_COMMON } from 'features/parseCheckLogs/checkLogs.constants.msgs';
import { Factory } from 'fishery';

import {
  CheckFailedLog,
  CheckLabelType,
  CheckLogs,
  CheckSucceededLog,
  PerCheckLogs,
  StartingLog,
} from 'features/parseCheckLogs/checkLogs.types';
import { CheckType } from 'types';

// Factory for CheckLabelType
const checkLabelTypeFactory = Factory.define<CheckLabelType>(() => ({
  check_name: 'I',
  detected_level: 'S',
  instance: 'I',
  job: 'I',
}));

// Helper functions to create individual log types
const createStartingLog = (probeName: string, time: number): StartingLog => ({
  Time: time,
  tsNs: time * 1000,
  labels: {
    probe: probeName,
    msg: MSG_STRINGS_COMMON.BeginningCheck,
    check_name: CheckType.HTTP,
    detected_level: 'info' as const,
    instance: faker.internet.ip(),
    job: faker.company.name(),
    probe_success: faker.helpers.arrayElement(['0', '1']),
    region: faker.location.countryCode(),
    service_name: faker.company.name(),
    source: 'synthetic-monitoring-agent' as const,
  },
  Line: faker.lorem.sentence(),
  labelTypes: checkLabelTypeFactory.build(),
  id: faker.string.uuid(),
});

const createSucceededLog = (probeName: string, time: number): CheckSucceededLog => ({
  Time: time,
  tsNs: time * 1000,
  labels: {
    probe: probeName,
    duration_seconds: faker.number.float({ min: 0.1, max: 30.0, fractionDigits: 3 }).toString(),
    msg: MSG_STRINGS_COMMON.CheckSucceeded,
    check_name: CheckType.HTTP,
    detected_level: 'info' as const,
    instance: faker.internet.ip(),
    job: faker.company.name(),
    probe_success: '1' as const,
    region: faker.location.countryCode(),
    service_name: faker.company.name(),
    source: 'synthetic-monitoring-agent' as const,
  },
  Line: faker.lorem.sentence(),
  labelTypes: checkLabelTypeFactory.build(),
  id: faker.string.uuid(),
});

const createFailedLog = (probeName: string, time: number): CheckFailedLog => ({
  Time: time,
  tsNs: time * 1000,
  labels: {
    probe: probeName,
    duration_seconds: faker.number.float({ min: 0.1, max: 30.0, fractionDigits: 3 }).toString(),
    msg: MSG_STRINGS_COMMON.CheckFailed,
    check_name: CheckType.HTTP,
    detected_level: 'error' as const,
    instance: faker.internet.ip(),
    job: faker.company.name(),
    probe_success: '0' as const,
    region: faker.location.countryCode(),
    service_name: faker.company.name(),
    source: 'synthetic-monitoring-agent' as const,
  },
  Line: faker.lorem.sentence(),
  labelTypes: checkLabelTypeFactory.build(),
  id: faker.string.uuid(),
});

// Factory for PerCheckLogs
export const perCheckLogsFactory = Factory.define<PerCheckLogs>(({ sequence }) => {
  const probeName = `probe${sequence + 1}`;
  const checkCount = faker.number.int({ min: 1, max: 3 });

  const checks = Array.from({ length: checkCount }, (_, checkIndex) => {
    const baseTime = faker.date.recent().getTime() - checkIndex * 60000; // Spread checks over time
    const isSuccess = faker.datatype.boolean();
    const endTime = baseTime + faker.number.int({ min: 100, max: 10000 });

    const startingLog = createStartingLog(probeName, baseTime);
    const endingLog = isSuccess ? createSucceededLog(probeName, endTime) : createFailedLog(probeName, endTime);

    return [startingLog, endingLog] as CheckLogs;
  });

  return {
    probe: probeName,
    checks: checks,
  };
});

// Convenience function to create multiple PerCheckLogs with different probe names
export const createPerCheckLogsArray = (probeCount = 3) => {
  return Array.from({ length: probeCount }, () => perCheckLogsFactory.build());
};

// Convenience function to create test data with specific times for filtering tests
export const createPerCheckLogsForTimeRange = (
  probeCount = 2,
  timepoint: { adjustedTime: number; timepointDuration: number }
) => {
  return Array.from({ length: probeCount }, (_, index) => {
    const probeName = `probe${index + 1}`;
    const checkCount = 2;

    const checks = Array.from({ length: checkCount }, (_, checkIndex) => {
      // Create some logs within the timepoint range and some outside
      const isInRange = checkIndex === 0;
      const baseTime = isInRange
        ? timepoint.adjustedTime - timepoint.timepointDuration / 2 // Within range
        : timepoint.adjustedTime - timepoint.timepointDuration - 60000; // Outside range

      const endTime = baseTime + faker.number.int({ min: 100, max: 5000 });

      const startingLog = createStartingLog(probeName, baseTime);
      const endingLog = createSucceededLog(probeName, endTime);

      return [startingLog, endingLog] as CheckLogs;
    });

    return {
      probe: probeName,
      checks: checks,
    };
  });
};
