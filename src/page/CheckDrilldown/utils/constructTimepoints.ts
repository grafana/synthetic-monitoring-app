import { CheckLogs, PerCheckLogs } from 'features/parseCheckLogs/checkLogs.types';
import { Timeseries, UseCheckDrilldownInfoProps } from 'page/CheckDrilldown/checkDrilldown.types';

export type Timepoint = {
  duration: number | null;
  probeDurations: Record<string, number>;
  probeLogs: Record<string, CheckLogs>;
  probeSuccesses: Record<string, 0 | 1>;
  timestamp: string | null;
  uptime: 0 | 1 | null;
};

const EMPTY_TIMEPOINT: Timepoint = {
  duration: null,
  probeDurations: {},
  probeLogs: {},
  probeSuccesses: {},
  timestamp: null,
  uptime: null,
};

type ConstructTimepointsProps = UseCheckDrilldownInfoProps & {
  timeseries: Timeseries;
  perCheckLogs: PerCheckLogs[];
};

export function constructTimepoints({ check, timeRange, timeseries, perCheckLogs }: ConstructTimepointsProps) {
  const { from, to } = timeRange;
  const { frequency } = check;

  const unixFrom = from.valueOf();
  const unixTo = to.valueOf();

  const timePoints = buildTimePointsFromTimeRange({ from: unixFrom, to: unixTo, frequency });
  const timePointsWithMetrics = assignTimeseries(timePoints, timeseries);
  const timePointsWithMetricsAndLogs = assignLogs(timePointsWithMetrics, perCheckLogs, frequency);

  return Object.values(timePointsWithMetricsAndLogs);
}

type GetTimePointsProps = {
  from: number;
  to: number;
  frequency: number;
};

function buildTimePointsFromTimeRange({ from, to, frequency }: GetTimePointsProps) {
  const timePoints: Record<string, Timepoint> = {};
  const remainder = from % frequency;

  for (let i = from - remainder; i <= to; i += frequency) {
    // copy the empty timepoint so they don't share the same reference
    // same with children which are objects
    timePoints[i] = { ...EMPTY_TIMEPOINT, probeDurations: {}, probeSuccesses: {}, probeLogs: {} };
  }

  return timePoints;
}

// mutating as is less memory intensive
// but might be safer to do this in a functional way
function assignTimeseries(timePoints: Record<string, Timepoint>, timeseries: Timeseries) {
  const { uptime = [], probeDuration = {}, probeSuccess = {} } = timeseries;

  uptime.forEach(([timestamp, value], i) => {
    try {
      timePoints[timestamp].uptime = value;
    } catch (error) {}
  });

  Object.entries(probeDuration).forEach(([probe, values]) => {
    try {
      values.forEach(([timestamp, value]) => {
        timePoints[timestamp].probeDurations[probe] = value;
      });
    } catch (error) {}
  });

  Object.entries(probeSuccess).forEach(([probe, values]) => {
    try {
      values.forEach(([timestamp, value]) => {
        timePoints[timestamp].probeSuccesses[probe] = value;
      });
    } catch (error) {}
  });

  Object.entries(timePoints).forEach(([timestamp, timepoint]) => {
    try {
      timePoints[timestamp].timestamp = timestamp;
      timePoints[timestamp].duration = getDuration(timepoint.probeDurations);
    } catch (error) {}
  });

  return timePoints;
}

function getDuration(probeDurations: Record<string, number>) {
  const values = Object.values(probeDurations);

  if (values.length === 0) {
    return null;
  }

  const reduced = values.reduce((acc, curr) => acc + curr, 0);
  const average = reduced / values.length;

  return average;
}

function assignLogs(timePoints: Record<string, Timepoint>, perCheckLogs: PerCheckLogs[], frequency: number) {
  perCheckLogs.forEach(({ probe, checks }) => {
    checks.forEach((checkLogs) => {
      const endingTime = checkLogs[checkLogs.length - 1].time;
      const timepointOwner = endingTime - (endingTime % frequency) + frequency;

      if (timePoints[timepointOwner]) {
        timePoints[timepointOwner].probeLogs[probe] = checkLogs;
      } else {
        console.log({ timepointOwner, checkLogs });
      }
    });
  });

  return timePoints;
}
