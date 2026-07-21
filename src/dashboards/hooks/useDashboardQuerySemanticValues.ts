import { useMemo } from 'react';
import { dateTime, rangeUtil, TimeRange } from '@grafana/data';

import { DashboardQuerySemanticValues } from 'dashboards/query/types';
import { useAppTime } from 'contexts/AppTimeProvider';
import { useCheckDashboard } from 'contexts/CheckDashboardProvider';

export function useDashboardQuerySemanticValues(maxDataPoints = 500): DashboardQuerySemanticValues {
  const { check, probes } = useCheckDashboard();
  const appTime = useAppTime();

  return useMemo(() => {
    const timeRange: TimeRange = {
      from: dateTime(appTime.absolute.from),
      to: dateTime(appTime.absolute.to),
      raw: appTime.raw,
    };
    const calc = rangeUtil.calculateInterval(timeRange, maxDataPoints, '1s');

    return {
      job: check.job,
      instance: check.target,
      probes,
      rangeSeconds: Math.max(1, Math.floor((appTime.absolute.to - appTime.absolute.from) / 1000)),
      interval: calc.interval,
      intervalMs: calc.intervalMs,
      rateInterval: calc.interval,
    };
  }, [appTime, check.job, check.target, maxDataPoints, probes]);
}

export function useDashboardTimeRange(): TimeRange {
  const appTime = useAppTime();

  return useMemo(
    () => ({
      from: dateTime(appTime.absolute.from),
      to: dateTime(appTime.absolute.to),
      raw: appTime.raw,
    }),
    [appTime]
  );
}
