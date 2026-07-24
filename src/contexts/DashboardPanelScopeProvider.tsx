import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useLocation, useNavigate } from 'react-router';

import { Check } from 'types';
import {
  DashboardUrlState,
  mergeDashboardUrlState,
  parseDashboardUrl,
  withDashboardUrlState,
  withLegacyDashboardUrlState,
} from 'routing/dashboardUrl';
import { transformLegacySceneDashboardUrl } from 'routing/legacySceneDashboardUrl';
import { useProbes } from 'data/useProbes';

import { DashboardUrlFormat, useCheckDashboard } from './CheckDashboardProvider';

export type DashboardPanelScopeContextValue = {
  probes: string[];
  setProbes: (probes: string[]) => void;
  catalog: string[];
  catalogLoading: boolean;
  catalogError: boolean;
};

const DashboardPanelScopeContext = createContext<DashboardPanelScopeContextValue | null>(null);

export function DashboardPanelScopeProvider({ children }: PropsWithChildren) {
  const { check, urlFormat } = useCheckDashboard();
  const location = useLocation();
  const navigate = useNavigate();
  const { data: probes = [], isLoading, isError } = useProbes();
  const probesById = useMemo(
    () => new Map(probes.map((probe) => [probe.id!, probe.name] as const)),
    [probes]
  );
  const catalog = useMemo(() => getConfiguredProbeNames(check, probesById), [check, probesById]);
  const [selectedProbes, setSelectedProbes] = useState<string[]>(
    () => readUrlState(new URLSearchParams(location.search), urlFormat).probes ?? []
  );

  const updateProbeUrl = useCallback(
    (nextProbes: string[]) => {
      const current = readUrlState(new URLSearchParams(location.search), urlFormat);
      const nextState: DashboardUrlState = mergeDashboardUrlState(current, {
        // Empty array clears the filter ("All probes"); undefined would preserve existing URL probes.
        probes: nextProbes.length > 0 ? nextProbes : [],
      });
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
        { replace: true }
      );
    },
    [location.pathname, location.search, navigate, urlFormat]
  );

  useEffect(() => {
    const urlProbes = readUrlState(new URLSearchParams(location.search), urlFormat).probes ?? [];

    setSelectedProbes(urlProbes);
  }, [location.search, urlFormat]);

  useEffect(() => {
    if (isLoading || isError || catalog.length === 0) {
      return;
    }

    const validProbes = selectedProbes.filter((probe) => catalog.includes(probe));

    if (validProbes.length !== selectedProbes.length) {
      updateProbeUrl(validProbes);
    }
  }, [catalog, isError, isLoading, selectedProbes, updateProbeUrl]);

  const setProbes = useCallback(
    (nextProbes: string[]) => {
      setSelectedProbes(nextProbes);
      updateProbeUrl(nextProbes);
    },
    [updateProbeUrl]
  );

  const value = useMemo<DashboardPanelScopeContextValue>(
    () => ({
      probes: selectedProbes,
      setProbes,
      catalog,
      catalogLoading: isLoading,
      catalogError: isError,
    }),
    [catalog, isError, isLoading, selectedProbes, setProbes]
  );

  return <DashboardPanelScopeContext.Provider value={value}>{children}</DashboardPanelScopeContext.Provider>;
}

export function useDashboardPanelScope(): DashboardPanelScopeContextValue {
  const context = useContext(DashboardPanelScopeContext);

  if (!context) {
    throw new Error('useDashboardPanelScope must be used within a DashboardPanelScopeProvider');
  }

  return context;
}

export function useDashboardPanelScopeOptional(): DashboardPanelScopeContextValue | null {
  return useContext(DashboardPanelScopeContext);
}

function getConfiguredProbeNames(check: Check, probesById: Map<number, string>): string[] {
  return (check.probes ?? [])
    .map((probeId) => probesById.get(probeId))
    .filter((name): name is string => Boolean(name));
}

function readUrlState(search: URLSearchParams, urlFormat: DashboardUrlFormat): DashboardUrlState {
  if (urlFormat === 'canonical') {
    const parsed = parseDashboardUrl(search);

    if (parsed.ok) {
      return parsed.state;
    }
  }

  return transformLegacySceneDashboardUrl(search);
}
