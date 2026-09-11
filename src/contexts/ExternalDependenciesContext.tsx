import React, { createContext, type PropsWithChildren, useContext } from 'react';
import { useQueries } from '@tanstack/react-query';
import { isAppPluginInstalled } from '@grafana/runtime';

import { EXTERNAL_DEPENDENCY_PLUGIN_IDS, type ExternalDependencyKey } from './ExternalDependencies.constants';

export type ExternalDependencyStatus = {
  installed: boolean;
  isLoading: boolean;
};

export type ExternalDependenciesValue = Record<ExternalDependencyKey, ExternalDependencyStatus>;

export type ExternalDependenciesOverrides = Partial<Record<ExternalDependencyKey, Partial<ExternalDependencyStatus>>>;

const DEPENDENCY_KEYS = Object.keys(EXTERNAL_DEPENDENCY_PLUGIN_IDS) as ExternalDependencyKey[];

function isFullyOverridden(overrides: ExternalDependenciesOverrides | undefined, key: ExternalDependencyKey): boolean {
  const o = overrides?.[key];
  return typeof o?.installed === 'boolean' && typeof o?.isLoading === 'boolean';
}

function resolveStatus(
  query: { data: boolean | undefined; isLoading: boolean },
  override: Partial<ExternalDependencyStatus> | undefined
): ExternalDependencyStatus {
  if (override && typeof override.installed === 'boolean' && typeof override.isLoading === 'boolean') {
    return { installed: override.installed, isLoading: override.isLoading };
  }

  return {
    installed: override?.installed ?? query.data ?? false,
    isLoading: override?.isLoading ?? query.isLoading,
  };
}

const ExternalDependenciesContext = createContext<ExternalDependenciesValue | null>(null);

type ExternalDependenciesProviderProps = PropsWithChildren<{
  overrides?: ExternalDependenciesOverrides;
}>;

export function ExternalDependenciesProvider({ children, overrides }: ExternalDependenciesProviderProps) {
  const queryResults = useQueries({
    queries: DEPENDENCY_KEYS.map((key) => ({
      queryKey: ['external-dependency', key, EXTERNAL_DEPENDENCY_PLUGIN_IDS[key]] as const,
      queryFn: () => isAppPluginInstalled(EXTERNAL_DEPENDENCY_PLUGIN_IDS[key]),
      staleTime: Infinity,
      enabled: !isFullyOverridden(overrides, key),
    })),
  });

  const value: ExternalDependenciesValue = {} as ExternalDependenciesValue;
  DEPENDENCY_KEYS.forEach((key, i) => {
    const q = queryResults[i];
    value[key] = resolveStatus({ data: q?.data, isLoading: q?.isLoading ?? false }, overrides?.[key]);
  });

  return <ExternalDependenciesContext.Provider value={value}>{children}</ExternalDependenciesContext.Provider>;
}

export function useExternalDependencies(): ExternalDependenciesValue {
  const ctx = useContext(ExternalDependenciesContext);
  if (!ctx) {
    throw new Error('useExternalDependencies must be used within an ExternalDependenciesProvider');
  }
  return ctx;
}
