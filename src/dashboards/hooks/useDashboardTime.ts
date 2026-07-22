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
  const appFrom = appTime?.absolute.from;
  const appTo = appTime?.absolute.to;
  const rawFrom = appTime?.raw.from;
  const rawTo = appTime?.raw.to;

  const appTimeRange = useMemo<TimeRange | null>(() => {
    if (appFrom === undefined || appTo === undefined || rawFrom === undefined || rawTo === undefined) {
      return null;
    }

    return {
      from: dateTime(appFrom),
      to: dateTime(appTo),
      raw: { from: rawFrom, to: rawTo },
    };
  }, [appFrom, appTo, rawFrom, rawTo]);

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
