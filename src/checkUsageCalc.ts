import { Check, UsageValues } from 'types';

interface ActiveSeriesParams {
  probeCount: number;
  frequencySeconds: number;
  seriesPerCheck: number;
}

const getChecksPerMonth = (frequencySeconds: number) => {
  const checksPerMinute = 60 / frequencySeconds;
  const checksPerHour = checksPerMinute * 60;
  const checksPerMonth = checksPerHour * 730;
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

export const calculateUsage = ({ probeCount, frequencySeconds, seriesPerCheck }: ActiveSeriesParams): UsageValues => {
  const activeSeries = seriesPerCheck * probeCount;
  return {
    checksPerMonth: getTotalChecksPerMonth(probeCount, frequencySeconds),
    activeSeries,
    logsGbPerMonth: getLogsGbPerMonth(probeCount, frequencySeconds),
    dpm: getDataPointsPerMinute(activeSeries, frequencySeconds),
  };
};

export function calculateMultiHTTPUsage(check: Partial<Check>): UsageValues {
  const logGBPerURLPerProbe = 0.000001151;
  const logGBPerAssertionPerCheck = 0.0000004;
  const seriesPerProbe = 36;
  const additionalSeriesPerUrl = 14;
  const frequencySeconds = (check?.frequency ?? 0) / 1000;

  const checksPerMonth = getChecksPerMonth(frequencySeconds);

  // Calculate logs
  const baseLogsGbPerMonth = checksPerMonth * logGBPerURLPerProbe * (check.settings?.multihttp?.entries?.length ?? 0);
  const assertionCount =
    check.settings?.multihttp?.entries.reduce((assertionCount, entry) => {
      return assertionCount + (entry.checks?.length ?? 0);
    }, 0) ?? 0;
  const assertionLogsGBPerMonth = checksPerMonth * assertionCount * logGBPerAssertionPerCheck;
  const totalLogsPerMonth = (baseLogsGbPerMonth + assertionLogsGBPerMonth) * (check.probes?.length ?? 0);

  // Calculate metrics
  const baseSeries = seriesPerProbe * (check.probes?.length ?? 0);
  const additionalUrls = (check.settings?.multihttp?.entries.length ?? 1) - 1;
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
