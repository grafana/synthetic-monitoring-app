import { calculateUsage } from './checkUsageCalc';
import { CheckType } from './types';

describe('http usage', () => {
  it('calculates with full metrics', () => {
    const baseUsage = calculateUsage({
      probeCount: 1,
      checkType: CheckType.HTTP,
      frequencySeconds: 60,
      useFullMetrics: true,
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
      useFullMetrics: true,
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
      useFullMetrics: true,
    });
    expect(differentFrequency).toStrictEqual({
      checksPerMonth: 1051200,
      activeSeries: 512,
      logsGbPerMonth: 0.84,
    });
  });
  it('calculates with basic metrics', () => {
    const baseUsage = calculateUsage({
      probeCount: 1,
      checkType: CheckType.HTTP,
      frequencySeconds: 60,
      useFullMetrics: false,
    });
    expect(baseUsage).toStrictEqual({
      checksPerMonth: 43800,
      activeSeries: 38,
      logsGbPerMonth: 0.04,
    });

    const multipleProbes = calculateUsage({
      probeCount: 4,
      checkType: CheckType.HTTP,
      frequencySeconds: 60,
      useFullMetrics: false,
    });
    expect(multipleProbes).toStrictEqual({
      checksPerMonth: 175200,
      activeSeries: 152,
      logsGbPerMonth: 0.14,
    });

    const differentFrequency = calculateUsage({
      probeCount: 4,
      checkType: CheckType.HTTP,
      frequencySeconds: 10,
      useFullMetrics: false,
    });
    expect(differentFrequency).toStrictEqual({
      checksPerMonth: 1051200,
      activeSeries: 152,
      logsGbPerMonth: 0.84,
    });
  });
});

describe('ping usage', () => {
  it('calculates with full metrics', () => {
    const baseUsage = calculateUsage({
      probeCount: 1,
      checkType: CheckType.PING,
      frequencySeconds: 60,
      useFullMetrics: true,
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
      useFullMetrics: true,
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
      useFullMetrics: true,
    });
    expect(differentFrequency).toStrictEqual({
      checksPerMonth: 1051200,
      activeSeries: 304,
      logsGbPerMonth: 0.84,
    });
  });
  it('calculates with basic metrics', () => {
    const baseUsage = calculateUsage({
      probeCount: 1,
      checkType: CheckType.PING,
      frequencySeconds: 60,
      useFullMetrics: false,
    });
    expect(baseUsage).toStrictEqual({
      checksPerMonth: 43800,
      activeSeries: 25,
      logsGbPerMonth: 0.04,
    });

    const multipleProbes = calculateUsage({
      probeCount: 4,
      checkType: CheckType.PING,
      frequencySeconds: 60,
      useFullMetrics: false,
    });
    expect(multipleProbes).toStrictEqual({
      checksPerMonth: 175200,
      activeSeries: 100,
      logsGbPerMonth: 0.14,
    });

    const differentFrequency = calculateUsage({
      probeCount: 4,
      checkType: CheckType.PING,
      frequencySeconds: 10,
      useFullMetrics: false,
    });
    expect(differentFrequency).toStrictEqual({
      checksPerMonth: 1051200,
      activeSeries: 100,
      logsGbPerMonth: 0.84,
    });
  });
});
describe('TCP usage', () => {
  it('calculates with full metrics', () => {
    const baseUsage = calculateUsage({
      probeCount: 1,
      checkType: CheckType.TCP,
      frequencySeconds: 60,
      useFullMetrics: true,
    });
    expect(baseUsage).toStrictEqual({
      checksPerMonth: 43800,
      activeSeries: 59,
      logsGbPerMonth: 0.04,
    });
  });
  it('calculates with basic metrics', () => {
    const baseUsage = calculateUsage({
      probeCount: 1,
      checkType: CheckType.TCP,
      frequencySeconds: 60,
      useFullMetrics: false,
    });
    expect(baseUsage).toStrictEqual({
      checksPerMonth: 43800,
      activeSeries: 23,
      logsGbPerMonth: 0.04,
    });
  });
});

describe('DNS usage', () => {
  it('calculates with full metrics', () => {
    const baseUsage = calculateUsage({
      probeCount: 1,
      checkType: CheckType.DNS,
      frequencySeconds: 60,
      useFullMetrics: true,
    });
    expect(baseUsage).toStrictEqual({
      checksPerMonth: 43800,
      activeSeries: 79,
      logsGbPerMonth: 0.04,
    });
  });
  it('calculates with basic metrics', () => {
    const baseUsage = calculateUsage({
      probeCount: 1,
      checkType: CheckType.DNS,
      frequencySeconds: 60,
      useFullMetrics: false,
    });
    expect(baseUsage).toStrictEqual({
      checksPerMonth: 43800,
      activeSeries: 28,
      logsGbPerMonth: 0.04,
    });
  });
});
