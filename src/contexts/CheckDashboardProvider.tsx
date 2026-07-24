import React, { createContext, PropsWithChildren, useContext, useMemo } from 'react';

import { Check } from 'types';

export type DashboardUrlFormat = 'canonical' | 'legacy';

export type CheckDashboardContextValue = {
  check: Check;
  urlFormat: DashboardUrlFormat;
};

const CheckDashboardContext = createContext<CheckDashboardContextValue | null>(null);

export function CheckDashboardProvider({
  check,
  children,
  urlFormat = 'legacy',
}: PropsWithChildren<{ check: Check; urlFormat?: DashboardUrlFormat }>) {
  const value = useMemo<CheckDashboardContextValue>(
    () => ({
      check,
      urlFormat,
    }),
    [check, urlFormat]
  );

  return <CheckDashboardContext.Provider value={value}>{children}</CheckDashboardContext.Provider>;
}

export function useCheckDashboard(): CheckDashboardContextValue {
  const context = useContext(CheckDashboardContext);

  if (!context) {
    throw new Error('useCheckDashboard must be used within a CheckDashboardProvider');
  }

  return context;
}

export function useCheckDashboardOptional(): CheckDashboardContextValue | null {
  return useContext(CheckDashboardContext);
}
