import { CheckType } from './types';

interface ActiveSeriesParams {
  probeCount: number;
  checkType: CheckType;
  frequencySeconds: number;
}

interface UsageValues {
  checksPerMonth: number;
  activeSeries: number;
  logsGbPerMonth: number;
}

enum CheckSeries {
  PING = 76,
  HTTP = 128,
  DNS = 79,
  TCP = 59,
}

const getSeriesPerCheck = (checkType: CheckType) => {
  switch (checkType) {
    case CheckType.PING:
      return CheckSeries.PING;
    case CheckType.TCP:
      return CheckSeries.TCP;
    case CheckType.DNS:
      return CheckSeries.DNS;
    case CheckType.HTTP:
      return CheckSeries.HTTP;
  }
};

const getMonthlyChecks = (frequencySeconds: number) => {
  const checksPerMinute = Math.round(60 / frequencySeconds);
  const checksPerHour = checksPerMinute * 60;
  const checksPerMonth = checksPerHour * 730;
  return checksPerMonth;
};

const getTotalChecksPerMonth = (probeCount: number, frequencySeconds: number) => {
  const checksPerMonth = getMonthlyChecks(frequencySeconds);
  return checksPerMonth * probeCount;
};

const getLogsGbPerMonth = (probeCount: number, frequencySeconds: number) => {
  const gbPerCheck = 0.0008;
  const checksPerMonth = getMonthlyChecks(frequencySeconds);
  const logsGbPerMonth = (checksPerMonth * gbPerCheck * probeCount) / 1000;
  return parseFloat(logsGbPerMonth.toFixed(2));
};

export const calculateUsage = ({ probeCount, checkType, frequencySeconds }: ActiveSeriesParams): UsageValues => {
  const seriesPerCheck = getSeriesPerCheck(checkType);
  const activeSeries = seriesPerCheck * probeCount;

  return {
    checksPerMonth: getTotalChecksPerMonth(probeCount, frequencySeconds),
    activeSeries,
    logsGbPerMonth: getLogsGbPerMonth(probeCount, frequencySeconds),
  };
};
