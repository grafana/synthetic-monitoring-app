import { useMemo } from 'react';
import { TimeRange } from '@grafana/data';

import { DashboardQuerySemanticValues } from 'dashboards/query/types';
import { useAppTime } from 'contexts/AppTimeProvider';
import { useCheckDashboard } from 'contexts/CheckDashboardProvider';
import { useDashboardPanelScopeOptional } from 'contexts/DashboardPanelScopeProvider';

import {
  createDashboardQuerySemanticValues,
  createDashboardTimeRange,
  DashboardQueryRange,
} from './dashboardQueryTime';

export function useDashboardQuerySemanticValues(
  maxDataPoints = 500,
  explicitRange?: DashboardQueryRange
): DashboardQuerySemanticValues {
  const { check } = useCheckDashboard();
  const panelScope = useDashboardPanelScopeOptional();
  const appTime = useAppTime();
  const range = explicitRange ?? appTime.absolute;
  const probes = panelScope?.probes;

  return useMemo(
    () =>
      createDashboardQuerySemanticValues({
        check,
        probes: probes ?? [],
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
