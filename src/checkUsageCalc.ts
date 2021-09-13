import { UsageValues } from 'types';

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

export const calculateUsage = ({ probeCount, frequencySeconds, seriesPerCheck }: ActiveSeriesParams): UsageValues => {
  const activeSeries = seriesPerCheck * probeCount;
  return {
    checksPerMonth: getTotalChecksPerMonth(probeCount, frequencySeconds),
    activeSeries,
    logsGbPerMonth: getLogsGbPerMonth(probeCount, frequencySeconds),
  };
};
