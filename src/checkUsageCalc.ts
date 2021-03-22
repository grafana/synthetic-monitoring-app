import { CheckType } from './types';

interface ActiveSeriesParams {
  probeCount: number;
  checkType: CheckType;
  frequencySeconds: number;
  useFullMetrics: boolean;
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
  Traceroute = 20,
}

enum CheckSeriesBasic {
  PING = 25,
  HTTP = 38,
  DNS = 28,
  TCP = 23,
  Traceroute = 20,
}

const getSeriesPerCheck = (checkType: CheckType, useFullMetrics: boolean) => {
  const Series = useFullMetrics ? CheckSeries : CheckSeriesBasic;
  switch (checkType) {
    case CheckType.PING:
      return Series.PING;
    case CheckType.TCP:
      return Series.TCP;
    case CheckType.DNS:
      return Series.DNS;
    case CheckType.HTTP:
      return Series.HTTP;
    case CheckType.Traceroute:
      return Series.Traceroute;
  }
};

const getChecksPerMonth = (frequencySeconds: number) => {
  const checksPerMinute = Math.round(60 / frequencySeconds);
  const checksPerHour = checksPerMinute * 60;
  const checksPerMonth = checksPerHour * 730;
  return checksPerMonth;
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

export const calculateUsage = ({
  probeCount,
  checkType,
  frequencySeconds,
  useFullMetrics,
}: ActiveSeriesParams): UsageValues => {
  const seriesPerCheck = getSeriesPerCheck(checkType, useFullMetrics);
  const activeSeries = seriesPerCheck * probeCount;

  return {
    checksPerMonth: getTotalChecksPerMonth(probeCount, frequencySeconds),
    activeSeries,
    logsGbPerMonth: getLogsGbPerMonth(probeCount, frequencySeconds),
  };
};
