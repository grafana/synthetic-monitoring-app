import React, { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';
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

export type DashboardUrlFormat = 'canonical' | 'legacy';

export type CheckDashboardContextValue = {
  check: Check;
  probes: string[];
  setProbes: (probes: string[]) => void;
  catalog: string[];
  catalogLoading: boolean;
  catalogError: boolean;
};

const CheckDashboardContext = createContext<CheckDashboardContextValue | null>(null);

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

export function CheckDashboardProvider({
  check,
  children,
  urlFormat = 'legacy',
}: PropsWithChildren<{ check: Check; urlFormat?: DashboardUrlFormat }>) {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: probes = [], isLoading, isError } = useProbes();
  const probesById = useMemo(
    () => new Map(probes.map((probe) => [probe.id!, probe.name] as const)),
    [probes]
  );
  const catalog = useMemo(() => getConfiguredProbeNames(check, probesById), [check, probesById]);

  const [selectedProbes, setSelectedProbes] = useState<string[]>(() => {
    const urlState = readUrlState(new URLSearchParams(location.search), urlFormat);
    return urlState.probes ?? [];
  });

  const updateProbeUrl = useCallback(
    (probes: string[]) => {
      const current = readUrlState(new URLSearchParams(location.search), urlFormat);
      const nextState: DashboardUrlState = mergeDashboardUrlState(current, {
        probes: probes.length > 0 ? probes : undefined,
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
    if (isLoading || isError || catalog.length === 0) {
      return;
    }

    setSelectedProbes((current) => {
      const validProbes = current.filter((probe) => catalog.includes(probe));

      if (validProbes.length !== current.length) {
        updateProbeUrl(validProbes);
        return validProbes;
      }

      return current;
    });
  }, [catalog, isError, isLoading, updateProbeUrl]);

  const setProbes = useCallback(
    (probes: string[]) => {
      setSelectedProbes(probes);
      updateProbeUrl(probes);
    },
    [updateProbeUrl]
  );

  const value = useMemo<CheckDashboardContextValue>(
    () => ({
      check,
      probes: selectedProbes,
      setProbes,
      catalog,
      catalogLoading: isLoading,
      catalogError: isError,
    }),
    [catalog, check, isError, isLoading, selectedProbes, setProbes]
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
