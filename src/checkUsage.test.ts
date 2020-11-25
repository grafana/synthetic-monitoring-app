import { calculateUsage } from './checkUsage';
import { CheckType } from './types';

it('calculates http usage', () => {
  const baseUsage = calculateUsage({
    probeCount: 1,
    checkType: CheckType.HTTP,
    frequencySeconds: 60,
  });
  expect(baseUsage).toStrictEqual({
    checksPerMonth: 43800,
    activeSeries: 128,
    logsGbPerMonth: 0.04,
  });

  const multipleProbes = calculateUsage({
    probeCount: 4,
    checkType: CheckType.HTTP,
    frequencySeconds: 60,
  });
  expect(multipleProbes).toStrictEqual({
    checksPerMonth: 175200,
    activeSeries: 512,
    logsGbPerMonth: 0.14,
  });

  const differentFrequency = calculateUsage({
    probeCount: 4,
    checkType: CheckType.HTTP,
    frequencySeconds: 10,
  });
  expect(differentFrequency).toStrictEqual({
    checksPerMonth: 1051200,
    activeSeries: 512,
    logsGbPerMonth: 0.84,
  });
});

it('calculates ping usage', () => {
  const baseUsage = calculateUsage({
    probeCount: 1,
    checkType: CheckType.PING,
    frequencySeconds: 60,
  });
  expect(baseUsage).toStrictEqual({
    checksPerMonth: 43800,
    activeSeries: 76,
    logsGbPerMonth: 0.04,
  });

  const multipleProbes = calculateUsage({
    probeCount: 4,
    checkType: CheckType.PING,
    frequencySeconds: 60,
  });
  expect(multipleProbes).toStrictEqual({
    checksPerMonth: 175200,
    activeSeries: 304,
    logsGbPerMonth: 0.14,
  });

  const differentFrequency = calculateUsage({
    probeCount: 4,
    checkType: CheckType.PING,
    frequencySeconds: 10,
  });
  expect(differentFrequency).toStrictEqual({
    checksPerMonth: 1051200,
    activeSeries: 304,
    logsGbPerMonth: 0.84,
  });
});

it('calculates TCP usage', () => {
  const baseUsage = calculateUsage({
    probeCount: 1,
    checkType: CheckType.TCP,
    frequencySeconds: 60,
  });
  expect(baseUsage).toStrictEqual({
    checksPerMonth: 43800,
    activeSeries: 59,
    logsGbPerMonth: 0.04,
  });
});

it('calculates DNS usage', () => {
  const baseUsage = calculateUsage({
    probeCount: 1,
    checkType: CheckType.DNS,
    frequencySeconds: 60,
  });
  expect(baseUsage).toStrictEqual({
    checksPerMonth: 43800,
    activeSeries: 79,
    logsGbPerMonth: 0.04,
  });
});
