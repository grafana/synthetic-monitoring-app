import React, { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';

import { Check } from 'types';
import { useProbes } from 'data/useProbes';
import { DashboardUrlState, mergeDashboardUrlState, withLegacyDashboardUrlState } from 'routing/dashboardUrl';
import { transformLegacySceneDashboardUrl } from 'routing/legacySceneDashboardUrl';

export type CheckDashboardContextValue = {
  check: Check;
  probes: string[];
  setProbes: (probes: string[]) => void;
  catalogLoading: boolean;
  catalogError: boolean;
};

const CheckDashboardContext = createContext<CheckDashboardContextValue | null>(null);

function getConfiguredProbeNames(check: Check, probesById: Map<number, string>): string[] {
  return (check.probes ?? [])
    .map((probeId) => probesById.get(probeId))
    .filter((name): name is string => Boolean(name));
}

export function CheckDashboardProvider({ check, children }: PropsWithChildren<{ check: Check }>) {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: probes = [], isLoading, isError } = useProbes();
  const probesById = useMemo(() => new Map(probes.map((probe) => [probe.id, probe.name])), [probes]);
  const catalog = useMemo(() => getConfiguredProbeNames(check, probesById), [check, probesById]);

  const [selectedProbes, setSelectedProbes] = useState<string[]>(() => {
    const urlState = transformLegacySceneDashboardUrl(new URLSearchParams(location.search));
    return urlState.probes ?? [];
  });

  const updateProbeUrl = useCallback(
    (probes: string[]) => {
      const current = transformLegacySceneDashboardUrl(new URLSearchParams(location.search));
      const nextState: DashboardUrlState = mergeDashboardUrlState(current, {
        probes: probes.length > 0 ? probes : undefined,
      });
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
        { replace: true }
      );
    },
    [location.pathname, location.search, navigate]
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
      catalogLoading: isLoading,
      catalogError: isError,
    }),
    [check, isError, isLoading, selectedProbes, setProbes]
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
