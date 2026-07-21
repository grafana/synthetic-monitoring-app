import React, { createContext, PropsWithChildren, useContext } from 'react';

type DashboardLegacyVarsContextValue = {
  job: string[];
  instance: string[];
  probe: string[];
};

const DashboardLegacyVarsContext = createContext<DashboardLegacyVarsContextValue | null>(null);

export function DashboardLegacyVarsProvider({
  value,
  children,
}: PropsWithChildren<{ value: DashboardLegacyVarsContextValue }>) {
  return <DashboardLegacyVarsContext.Provider value={value}>{children}</DashboardLegacyVarsContext.Provider>;
}

export function useDashboardLegacyVarsOptional(): DashboardLegacyVarsContextValue | null {
  return useContext(DashboardLegacyVarsContext);
}

export type DashboardLegacyRefreshContextValue = {
  refresh?: string;
  refreshInMs?: number;
  subscribeRefresh?: (callback: () => void) => () => void;
};

const DashboardLegacyRefreshContext = createContext<DashboardLegacyRefreshContextValue | null>(null);

export function DashboardLegacyRefreshProvider({
  value,
  children,
}: PropsWithChildren<{ value: DashboardLegacyRefreshContextValue }>) {
  return <DashboardLegacyRefreshContext.Provider value={value}>{children}</DashboardLegacyRefreshContext.Provider>;
}

export function useDashboardLegacyRefreshOptional(): DashboardLegacyRefreshContextValue | null {
  return useContext(DashboardLegacyRefreshContext);
}
