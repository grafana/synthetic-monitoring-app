import { UsageValues } from 'types';

interface ActiveSeriesParams {
  assertionCount: number;
  probeCount: number;
  frequencySeconds: number;
  seriesPerProbe: number;
}

// the backend calculation is more nuanced than this, but this is a good enough approximation
// https://github.com/grafana/synthetic-monitoring-api/blob/1a6b6e0af252aa838ce02df801f5b36295e1a9c9/internal/dto/limits/calculations.go#L7
// Slack context: https://raintank-corp.slack.com/archives/C0175SS6SA3/p1714059415879179

const DAYS_IN_MONTH = 31;

const getChecksPerMonth = (frequencySeconds: number) => {
  const checksPerMinute = 60 / frequencySeconds;
  const checksPerHour = checksPerMinute * 60;
  const checksPerDay = checksPerHour * 24;
  const checksPerMonth = checksPerDay * DAYS_IN_MONTH;
  return Math.round(checksPerMonth);
};

export const getTotalChecksPerMonth = (probeCount: number, frequencySeconds: number) => {
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
