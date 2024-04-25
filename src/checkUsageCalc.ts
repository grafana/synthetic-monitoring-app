import { UsageValues } from 'types';

interface ActiveSeriesParams {
  assertionCount: number;
  probeCount: number;
  frequencySeconds: number;
  seriesPerProbe: number;
}

const getChecksPerMonth = (frequencySeconds: number) => {
  const checksPerMinute = 60 / frequencySeconds;
  const checksPerHour = checksPerMinute * 60;
  const checksPerMonth = checksPerHour * 744; // Assume a 31 day month so users aren't surprised
  return Math.round(checksPerMonth);
};

const getTotalChecksPerMonth = (probeCount: number, frequencySeconds: number) => {
  const checksPerMonth = getChecksPerMonth(frequencySeconds);
  return checksPerMonth * probeCount;
};

const getLogsGbPerMonth = (probeCount: number, frequencySeconds: number) => {
  const gbPerCheck = 0.0008;
  const checksPerMonth = getChecksPerMonth(frequencySeconds);
  const logsGbPerMonth = (checksPerMonth * gbPerCheck * probeCount) / 1000;
  return parseFloat(logsGbPerMonth.toFixed(2));
};

const getDataPointsPerMinute = (activeSeries: number, frequencySeconds: number) => {
  const dpm = activeSeries * Math.max(1, 60 / frequencySeconds);
  return Math.ceil(dpm);
};

export const calculateUsage = ({
  assertionCount,
  probeCount,
  frequencySeconds,
  seriesPerProbe,
}: ActiveSeriesParams): UsageValues => {
  const activeSeries = seriesPerProbe * probeCount;

  return {
    checksPerMonth: getTotalChecksPerMonth(probeCount, frequencySeconds),
    activeSeries,
    logsGbPerMonth: getLogsGbPerMonth(probeCount, frequencySeconds),
    dpm: getDataPointsPerMinute(activeSeries, frequencySeconds),
  };
};

export function calculateMultiHTTPUsage({
  assertionCount,
  probeCount,
  frequencySeconds,
  seriesPerProbe,
}: ActiveSeriesParams): UsageValues {
  const logGBPerProbe = 0.000001151;
  const logGBPerAssertionPerCheck = 0.0000004;
  const additionalSeriesPerUrl = 14;

  const checksPerMonth = getChecksPerMonth(frequencySeconds);

  // Calculate logs
  const baseLogsGbPerMonth = checksPerMonth * logGBPerProbe;
  const assertionLogsGBPerMonth = checksPerMonth * assertionCount * logGBPerAssertionPerCheck;
  const totalLogsPerMonth = (baseLogsGbPerMonth + assertionLogsGBPerMonth) * probeCount;

  // Calculate metrics
  const baseSeries = seriesPerProbe * probeCount;
  const additionalUrls = assertionCount - 1;
  const additionalSeries = additionalSeriesPerUrl * additionalUrls;
  const activeSeries = baseSeries + additionalSeries;

  const dpm = getDataPointsPerMinute(activeSeries, frequencySeconds);

  return {
    checksPerMonth,
    activeSeries,
    logsGbPerMonth: totalLogsPerMonth,
    dpm,
  };
}
