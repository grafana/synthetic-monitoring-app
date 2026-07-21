import { useMemo } from 'react';
import { dateTime, TimeRange } from '@grafana/data';
import { usePanelTimeRangeOptional } from 'dashboards/runtime/PanelTimeRangeContext';

import { useAppTimeOptional } from 'contexts/AppTimeProvider';
import { useCheckDashboardOptional } from 'contexts/CheckDashboardProvider';

/**
 * Dashboard time for panels and Timepoint Explorer.
 * Uses AppTime when mounted; falls back to panel time range on legacy Scene dashboards.
 */
export function useDashboardTime(): TimeRange {
  const checkDashboard = useCheckDashboardOptional();
  const appTime = useAppTimeOptional();
  const panelTimeRange = usePanelTimeRangeOptional();

  const appTimeRange = useMemo<TimeRange | null>(() => {
    if (!appTime) {
      return null;
    }

    return {
      from: dateTime(appTime.absolute.from),
      to: dateTime(appTime.absolute.to),
      raw: appTime.raw,
    };
  }, [appTime]);

  return useMemo(() => {
    if (checkDashboard && appTimeRange) {
      return appTimeRange;
    }

    if (panelTimeRange) {
      return panelTimeRange;
    }

    if (appTimeRange) {
      return appTimeRange;
    }

    throw new Error('useDashboardTime requires AppTimeProvider or PanelTimeRangeProvider');
  }, [appTimeRange, checkDashboard, panelTimeRange]);
}
