import React, { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { invalidateActiveDashboardQueries } from 'dashboards/query/dashboardQueryInvalidation';

import { FeatureName } from 'types';
import {
  DashboardUrlState,
  mergeDashboardUrlState,
  withDashboardUrlState,
  withLegacyDashboardUrlState,
} from 'routing/dashboardUrl';
import { transformLegacySceneDashboardUrl } from 'routing/legacySceneDashboardUrl';
import { AppRoutes } from 'routing/types';
import { getRoute } from 'routing/utils';
import { useFeatureFlag } from 'hooks/useFeatureFlag';

import {
  absoluteTimeRangeToRaw,
  type AppTimeRangeMode,
  canShiftTimeRangeForward,
  DEFAULT_APP_TIME_RANGE,
  DEFAULT_APP_TIMEZONE,
  getAbsoluteBounds,
  getAppTimeRangeMode,
  getShiftedTimeRange,
  getZoomedTimeRange,
  isValidTimeRange,
  parseTimeIntervalMs,
  refreshRelativeRange,
  resolveTimeRange,
} from './AppTimeProvider.utils';

export type AppTimeContextValue = {
  raw: { from: string; to: string };
  absolute: { from: number; to: number };
  rangeMode: AppTimeRangeMode;
  timezone: string;
  refresh?: string;
  setTimeRange: (next: { from: string; to: string }) => void;
  setTimezone: (timezone: string) => void;
  setRefresh: (refresh?: string) => void;
  refreshNow: () => void;
  shiftBackward: () => void;
  shiftForward: () => void;
  zoomOut: () => void;
  buildDashboardPath: (checkId: number) => string;
  subscribeRefresh: (listener: () => void) => () => void;
};

const AppTimeContext = createContext<AppTimeContextValue | null>(null);

function isTimeParticipatingPath(pathname: string): boolean {
  const checksPath = getRoute(AppRoutes.Checks);
  const dashboardPathPrefix = `${checksPath}/`;

  return pathname === checksPath || (pathname.startsWith(dashboardPathPrefix) && !pathname.endsWith('/edit'));
}

function readDashboardState(search: URLSearchParams): DashboardUrlState {
  const parsed = transformLegacySceneDashboardUrl(search);
  const merged: DashboardUrlState = {
    ...parsed,
    from: parsed.from ?? DEFAULT_APP_TIME_RANGE.from,
    to: parsed.to ?? DEFAULT_APP_TIME_RANGE.to,
    timezone: parsed.timezone ?? DEFAULT_APP_TIMEZONE,
  };

  // Probe selection is owned by DashboardPanelScopeProvider — keep AppTime time-only.
  const { probes: _probes, ...timeState } = merged;

  return timeState;
}

function isSameDashboardState(current: DashboardUrlState, next: DashboardUrlState): boolean {
  return (
    current.version === next.version &&
    current.from === next.from &&
    current.to === next.to &&
    current.timezone === next.timezone &&
    current.refresh === next.refresh &&
    JSON.stringify(current.comparison) === JSON.stringify(next.comparison)
  );
}

function hasExplicitTimeState(search: URLSearchParams): boolean {
  const state = transformLegacySceneDashboardUrl(search);

  return Boolean(state.from || state.to || state.refresh || state.timezone || state.comparison);
}

export function AppTimeProvider({ children }: PropsWithChildren) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isEnabled: sceneFreeHttpDashboard } = useFeatureFlag(FeatureName.SceneFreeHttpDashboard);
  const refreshListeners = useRef(new Set<() => void>());
  const [refreshRevision, setRefreshRevision] = useState(0);
  const [state, setState] = useState<DashboardUrlState>(() =>
    hasExplicitTimeState(new URLSearchParams(location.search))
      ? readDashboardState(new URLSearchParams(location.search))
      : {
          version: 1,
          timezone: DEFAULT_APP_TIMEZONE,
          ...DEFAULT_APP_TIME_RANGE,
        }
  );

  const participating = isTimeParticipatingPath(location.pathname);
  const urlFormat = sceneFreeHttpDashboard && participating ? 'canonical' : 'legacy';

  useEffect(() => {
    if (!participating) {
      return;
    }

    const search = new URLSearchParams(location.search);
    const nextState = readDashboardState(search);
    setState((current) => isSameDashboardState(current, nextState) ? current : nextState);
  }, [location.pathname, location.search, participating]);

  const commitState = useCallback(
    (nextState: DashboardUrlState, replace = false) => {
      setState(nextState);

      if (!participating) {
        return;
      }

      const nextPath =
        urlFormat === 'canonical'
          ? withDashboardUrlState(location.pathname, nextState, new URLSearchParams(location.search), 'canonical')
          : withLegacyDashboardUrlState(location.pathname, nextState, new URLSearchParams(location.search));
      const queryIndex = nextPath.indexOf('?');
      const search = queryIndex >= 0 ? nextPath.slice(queryIndex) : '';

      navigate(
        {
          pathname: location.pathname,
          search,
        },
        { replace }
      );
    },
    [location.pathname, location.search, navigate, participating, urlFormat]
  );

  const setTimeRange = useCallback(
    (next: { from: string; to: string }) => {
      commitState(
        mergeDashboardUrlState(state, {
          from: next.from,
          to: next.to,
        })
      );
    },
    [commitState, state]
  );

  const setTimezone = useCallback(
    (timezone: string) => {
      commitState(
        mergeDashboardUrlState(state, {
          timezone,
        }),
        true
      );
    },
    [commitState, state]
  );

  const setRefresh = useCallback(
    (refresh?: string) => {
      commitState(
        mergeDashboardUrlState(state, {
          refresh,
        }),
        true
      );
    },
    [commitState, state]
  );

  const refreshNow = useCallback(() => {
    const nextRange = refreshRelativeRange(state.from ?? DEFAULT_APP_TIME_RANGE.from, state.to ?? DEFAULT_APP_TIME_RANGE.to);
    const nextState = mergeDashboardUrlState(state, nextRange);

    setState(nextState);
    setRefreshRevision((revision) => revision + 1);
    refreshListeners.current.forEach((listener) => listener());
    void invalidateActiveDashboardQueries();
  }, [state]);

  useEffect(() => {
    if (!state.refresh || !participating) {
      return;
    }

    const intervalMs = parseTimeIntervalMs(state.refresh);

    if (!intervalMs) {
      return;
    }

    let timeoutId: number | undefined;
    let lastRefresh = Date.now();

    const schedule = () => {
      timeoutId = window.setTimeout(() => {
        if (document.hidden) {
          schedule();
          return;
        }

        refreshNow();
        lastRefresh = Date.now();
        schedule();
      }, intervalMs);
    };

    schedule();

    const handleVisibility = () => {
      if (!document.hidden && state.refresh && Date.now() - lastRefresh >= intervalMs) {
        refreshNow();
        lastRefresh = Date.now();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [participating, refreshNow, state.refresh]);

  const buildDashboardPath = useCallback(
    (checkId: number) => {
      const path = `${getRoute(AppRoutes.Checks)}/${checkId}`;

      return urlFormat === 'canonical'
        ? withDashboardUrlState(path, state, undefined, 'canonical')
        : withLegacyDashboardUrlState(path, state);
    },
    [state, urlFormat]
  );

  const subscribeRefresh = useCallback((listener: () => void) => {
    refreshListeners.current.add(listener);

    return () => {
      refreshListeners.current.delete(listener);
    };
  }, []);

  const raw = useMemo(
    () => ({
      from: state.from ?? DEFAULT_APP_TIME_RANGE.from,
      to: state.to ?? DEFAULT_APP_TIME_RANGE.to,
    }),
    [state.from, state.to]
  );
  const timezone = state.timezone ?? DEFAULT_APP_TIMEZONE;
  const rangeMode = useMemo(() => getAppTimeRangeMode(raw), [raw]);
  const resolvedRange = useMemo(
    () => resolveTimeRange(raw.from, raw.to, timezone),
    // Refreshing a relative range intentionally resolves "now" again without changing its raw values.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [raw, refreshRevision, timezone]
  );

  const applyResolvedRange = useCallback(
    (nextRange: ReturnType<typeof getShiftedTimeRange>) => {
      if (!isValidTimeRange(nextRange)) {
        return;
      }

      setTimeRange(
        absoluteTimeRangeToRaw({
          from: nextRange.from.valueOf(),
          to: nextRange.to.valueOf(),
        })
      );
    },
    [setTimeRange]
  );

  const shiftBackward = useCallback(() => {
    applyResolvedRange(getShiftedTimeRange('backward', resolvedRange));
  }, [applyResolvedRange, resolvedRange]);

  const shiftForward = useCallback(() => {
    if (!canShiftTimeRangeForward(resolvedRange)) {
      return;
    }

    applyResolvedRange(getShiftedTimeRange('forward', resolvedRange));
  }, [applyResolvedRange, resolvedRange]);

  const zoomOut = useCallback(() => {
    applyResolvedRange(getZoomedTimeRange(resolvedRange, 2));
  }, [applyResolvedRange, resolvedRange]);

  const value = useMemo<AppTimeContextValue>(
    () => ({
      raw,
      absolute: getAbsoluteBounds(resolvedRange),
      rangeMode,
      timezone,
      refresh: state.refresh,
      setTimeRange,
      setTimezone,
      setRefresh,
      refreshNow,
      shiftBackward,
      shiftForward,
      zoomOut,
      buildDashboardPath,
      subscribeRefresh,
    }),
    [
      buildDashboardPath,
      raw,
      rangeMode,
      refreshNow,
      resolvedRange,
      setRefresh,
      setTimeRange,
      setTimezone,
      shiftBackward,
      shiftForward,
      state.refresh,
      subscribeRefresh,
      timezone,
      zoomOut,
    ]
  );

  return <AppTimeContext.Provider value={value}>{children}</AppTimeContext.Provider>;
}

export function useAppTime(): AppTimeContextValue {
  const context = useContext(AppTimeContext);

  if (!context) {
    throw new Error('useAppTime must be used within an AppTimeProvider');
  }

  return context;
}

export function useAppTimeOptional(): AppTimeContextValue | null {
  return useContext(AppTimeContext);
}
