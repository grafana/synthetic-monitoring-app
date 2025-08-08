import { UsageValues } from 'types';
import { ONE_SECOND_IN_MS } from 'utils.constants';

interface ActiveSeriesParams {
  assertionCount: number;
  probeCount: number;
  frequency: number;
  seriesPerProbe: number;
}

// the backend calculation is more nuanced than this, but this is a good enough approximation
// https://github.com/grafana/synthetic-monitoring-api/blob/1a6b6e0af252aa838ce02df801f5b36295e1a9c9/internal/dto/limits/calculations.go#L7
// Slack context: https://raintank-corp.slack.com/archives/C0175SS6SA3/p1714059415879179

const DAYS_IN_MONTH = 31;
const SECONDS_IN_MINUTE = 60;

const getChecksPerMonth = (frequency: number) => {
  const frequencyInSeconds = frequency / ONE_SECOND_IN_MS;
  const checksPerMinute = SECONDS_IN_MINUTE / frequencyInSeconds;
  const checksPerHour = checksPerMinute * 60;
  const checksPerDay = checksPerHour * 24;
  const checksPerMonth = checksPerDay * DAYS_IN_MONTH;

  return Math.round(checksPerMonth);
};

export const getTotalChecksPerMonth = (probeCount: number, frequency: number) => {
  const checksPerMonth = getChecksPerMonth(frequency);
  return checksPerMonth * probeCount;
};

export const getTotalChecksPerPeriod = (probeCount: number, frequency: number, period: number) => {
  // Use same logic as backend: floor(period / frequency) * probeCount
  // This counts only complete executions that can finish within the period
  // https://github.com/grafana/synthetic-monitoring-api/blob/410d4c402829df22f3d6adf4d00fa0146ebe01ad/internal/alerts/rules.go#L235-L239
  const maxExecutions = Math.floor(period / frequency);
  return maxExecutions * probeCount;
};

const getLogsGbPerMonth = (probeCount: number, frequency: number) => {
  const gbPerCheck = 0.0008;
  const checksPerMonth = getChecksPerMonth(frequency);
  const logsGbPerMonth = (checksPerMonth * gbPerCheck * probeCount) / 1000;
  return parseFloat(logsGbPerMonth.toFixed(2));
};

const getDataPointsPerMinute = (activeSeries: number, frequency: number) => {
  const dpm = activeSeries * Math.max(1, (60 / frequency) * ONE_SECOND_IN_MS);
  return Math.ceil(dpm);
};

export const calculateUsage = ({ probeCount, frequency, seriesPerProbe }: ActiveSeriesParams): UsageValues => {
  const activeSeries = seriesPerProbe * probeCount;

  return {
    checksPerMonth: getTotalChecksPerMonth(probeCount, frequency),
    activeSeries,
    logsGbPerMonth: getLogsGbPerMonth(probeCount, frequency),
    dpm: getDataPointsPerMinute(activeSeries, frequency),
  };
};

export function calculateMultiHTTPUsage({
  assertionCount,
  probeCount,
  frequency,
  seriesPerProbe,
}: ActiveSeriesParams): UsageValues {
  const logGBPerProbe = 0.000001151;
  const logGBPerAssertionPerCheck = 0.0000004;
  const additionalSeriesPerUrl = 14;

  const checksPerMonth = getTotalChecksPerMonth(probeCount, frequency);

  // Calculate logs
  const baseLogsGbPerMonth = checksPerMonth * logGBPerProbe;
  const assertionLogsGBPerMonth = checksPerMonth * assertionCount * logGBPerAssertionPerCheck;
  const totalLogsPerMonth = (baseLogsGbPerMonth + assertionLogsGBPerMonth) * probeCount;

  // Calculate metrics
  const baseSeries = seriesPerProbe * probeCount;
  const additionalUrls = assertionCount - 1;
  const additionalSeries = additionalSeriesPerUrl * additionalUrls;
  const activeSeries = baseSeries + additionalSeries;

  const dpm = getDataPointsPerMinute(activeSeries, frequency);

  return {
    checksPerMonth,
    activeSeries,
    logsGbPerMonth: totalLogsPerMonth,
    dpm,
  };
}
