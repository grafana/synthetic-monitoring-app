import { useEffect } from 'react';
import { durationToMilliseconds, parseDuration } from '@grafana/data';
import { useDashboardLegacyRefreshOptional } from 'dashboards/runtime/DashboardLegacyRuntime';

import { useAppTimeOptional } from 'contexts/AppTimeProvider';

type DashboardRefreshState = {
  refresh?: string;
  refreshInMs?: number;
};

/**
 * Dashboard refresh signalling for Timepoint Explorer pending refetch logic.
 * Uses AppTime on scene-free routes; falls back to legacy refresh runtime on Scene dashboards.
 */
export function useDashboardRefresh(onRefresh?: () => void): DashboardRefreshState | null {
  const appTime = useAppTimeOptional();
  const legacyRefresh = useDashboardLegacyRefreshOptional();

  useEffect(() => {
    if (!appTime || !onRefresh) {
      return;
    }

    return appTime.subscribeRefresh(onRefresh);
  }, [appTime, onRefresh]);

  useEffect(() => {
    if (appTime || !legacyRefresh?.subscribeRefresh || !onRefresh) {
      return;
    }

    return legacyRefresh.subscribeRefresh(onRefresh);
  }, [appTime, legacyRefresh, onRefresh]);

  if (appTime) {
    if (!appTime.refresh) {
      return { refresh: appTime.refresh };
    }

    return {
      refresh: appTime.refresh,
      refreshInMs: durationToMilliseconds(parseDuration(appTime.refresh)),
    };
  }

  return legacyRefresh;
}
