import React, { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';

import { AppRoutes } from 'routing/types';
import { DashboardUrlState, mergeDashboardUrlState, withLegacyDashboardUrlState } from 'routing/dashboardUrl';
import { transformLegacySceneDashboardUrl } from 'routing/legacySceneDashboardUrl';
import { getRoute } from 'routing/utils';

import {
  DEFAULT_APP_TIME_RANGE,
  DEFAULT_APP_TIMEZONE,
  getAbsoluteBounds,
  refreshRelativeRange,
  resolveTimeRange,
} from './AppTimeProvider.utils';

export type AppTimeContextValue = {
  raw: { from: string; to: string };
  absolute: { from: number; to: number };
  timezone: string;
  refresh?: string;
  setTimeRange: (next: { from: string; to: string }) => void;
  setRefresh: (refresh?: string) => void;
  refreshNow: () => void;
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
  return mergeDashboardUrlState(
    {
      version: 1,
      timezone: DEFAULT_APP_TIMEZONE,
      ...DEFAULT_APP_TIME_RANGE,
    },
    transformLegacySceneDashboardUrl(search)
  );
}

function hasExplicitTimeState(search: URLSearchParams): boolean {
  const state = transformLegacySceneDashboardUrl(search);

  return Boolean(state.from || state.to || state.refresh || state.timezone);
}

export function AppTimeProvider({ children }: PropsWithChildren) {
  const location = useLocation();
  const navigate = useNavigate();
  const refreshListeners = useRef(new Set<() => void>());
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

  useEffect(() => {
    if (!participating) {
      return;
    }

    const search = new URLSearchParams(location.search);

    if (hasExplicitTimeState(search)) {
      setState(readDashboardState(search));
    }
  }, [location.pathname, location.search, participating]);

  const commitState = useCallback(
    (nextState: DashboardUrlState, replace = false) => {
      setState(nextState);

      if (!participating) {
        return;
      }

      const nextPath = withLegacyDashboardUrlState(
        location.pathname,
        nextState,
        new URLSearchParams(location.search)
      );
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
    [location.pathname, location.search, navigate, participating]
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
    refreshListeners.current.forEach((listener) => listener());
  }, [state]);

  useEffect(() => {
    if (!state.refresh || !participating) {
      return;
    }

    const intervalMs = rangeToMs(state.refresh);

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
      return withLegacyDashboardUrlState(`${getRoute(AppRoutes.Checks)}/${checkId}`, state);
    },
    [state]
  );

  const subscribeRefresh = useCallback((listener: () => void) => {
    refreshListeners.current.add(listener);

    return () => {
      refreshListeners.current.delete(listener);
    };
  }, []);

  const raw = {
    from: state.from ?? DEFAULT_APP_TIME_RANGE.from,
    to: state.to ?? DEFAULT_APP_TIME_RANGE.to,
  };
  const resolvedRange = resolveTimeRange(raw.from, raw.to);

  const value = useMemo<AppTimeContextValue>(
    () => ({
      raw,
      absolute: getAbsoluteBounds(resolvedRange),
      timezone: state.timezone ?? DEFAULT_APP_TIMEZONE,
      refresh: state.refresh,
      setTimeRange,
      setRefresh,
      refreshNow,
      buildDashboardPath,
      subscribeRefresh,
    }),
    [buildDashboardPath, raw, refreshNow, resolvedRange, setRefresh, setTimeRange, state.refresh, state.timezone, subscribeRefresh]
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

function rangeToMs(value: string): number | undefined {
  const match = /^(\d+)(ms|s|m|h|d)$/.exec(value.trim());

  if (!match) {
    return undefined;
  }

  const amount = Number(match[1]);
  const unit = match[2];

  switch (unit) {
    case 'ms':
      return amount;
    case 's':
      return amount * 1_000;
    case 'm':
      return amount * 60_000;
    case 'h':
      return amount * 3_600_000;
    case 'd':
      return amount * 86_400_000;
    default:
      return undefined;
  }
}
