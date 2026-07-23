import { dateTime, rangeUtil, TimeRange } from '@grafana/data';

import { DashboardQuerySemanticValues } from 'dashboards/query/types';
import { Check } from 'types';

export interface DashboardQueryRange {
  from: number;
  to: number;
}

export interface DashboardAppTime {
  absolute: DashboardQueryRange;
  raw: TimeRange['raw'];
}

export function createDashboardTimeRange(
  appTime: DashboardAppTime,
  explicitRange?: DashboardQueryRange
): TimeRange {
  const range = explicitRange ?? appTime.absolute;

  return {
    from: dateTime(range.from),
    to: dateTime(range.to),
    raw: explicitRange ? { from: dateTime(range.from), to: dateTime(range.to) } : appTime.raw,
  };
}

export function createDashboardQuerySemanticValues({
  check,
  probes,
  range,
  maxDataPoints,
}: {
  check: Pick<Check, 'job' | 'target'>;
  probes: string[];
  range: DashboardQueryRange;
  maxDataPoints: number;
}): DashboardQuerySemanticValues {
  const timeRange = createDashboardTimeRange(
    {
      absolute: range,
      raw: { from: dateTime(range.from), to: dateTime(range.to) },
    },
    range
  );
  const interval = rangeUtil.calculateInterval(timeRange, maxDataPoints, '1s');

  return {
    job: check.job,
    instance: check.target,
    probes,
    rangeSeconds: Math.max(1, Math.floor((range.to - range.from) / 1000)),
    interval: interval.interval,
    intervalMs: interval.intervalMs,
    rateInterval: interval.interval,
  };
}
