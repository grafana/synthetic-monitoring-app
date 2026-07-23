import { useMemo } from 'react';
import { TimeRange } from '@grafana/data';

import { DashboardQuerySemanticValues } from 'dashboards/query/types';
import { useAppTime } from 'contexts/AppTimeProvider';
import { useCheckDashboard } from 'contexts/CheckDashboardProvider';

import {
  createDashboardQuerySemanticValues,
  createDashboardTimeRange,
  DashboardQueryRange,
} from './dashboardQueryTime';

export function useDashboardQuerySemanticValues(
  maxDataPoints = 500,
  explicitRange?: DashboardQueryRange
): DashboardQuerySemanticValues {
  const { check, probes } = useCheckDashboard();
  const appTime = useAppTime();
  const range = explicitRange ?? appTime.absolute;

  return useMemo(
    () =>
      createDashboardQuerySemanticValues({
        check,
        probes,
        range,
        maxDataPoints,
      }),
    [check, maxDataPoints, probes, range]
  );
}

export function useDashboardTimeRange(explicitRange?: DashboardQueryRange): TimeRange {
  const appTime = useAppTime();

  return useMemo(() => createDashboardTimeRange(appTime, explicitRange), [appTime, explicitRange]);
}
