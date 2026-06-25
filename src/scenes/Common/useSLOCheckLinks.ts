import { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usePluginFunctions } from '@grafana/runtime';

import type { SLO } from './useSLOCheckLinks.types';
import { useExternalDependencies } from 'contexts/ExternalDependenciesContext';
import { useChecks } from 'data/useChecks';

import { SLO_APP_API_EXTENSION_POINT_ID } from './useSLOCheckLinks.constants';
import { buildSLOCheckLinkMap } from './useSLOCheckLinks.utils';

export const sloQueryKeys = {
  all: ['slos'] as const,
};

export type SLOPluginUpdateResult = {
  data?: SLO;
  error?: unknown;
};

export type SLOPluginDeleteResult = {
  data?: unknown;
  error?: unknown;
};

export type GrafanaSLOPluginApi = {
  getSlos: () => Promise<{
    data?: { slos: SLO[] };
    error?: unknown;
  }>;
  updateSlo?: (slo: SLO) => Promise<SLOPluginUpdateResult>;
  deleteSlo?: (uuid: string) => Promise<SLOPluginDeleteResult>;
};

async function fetchSLOsList(getApi: () => Promise<GrafanaSLOPluginApi>): Promise<SLO[]> {
  try {
    const api = await getApi();
    const result = await api.getSlos();
    if (result?.error) {
      const status =
        typeof result.error === 'object' && result.error !== null && 'status' in result.error
          ? (result.error as { status?: number }).status
          : undefined;
      if (status === 404) {
        return [];
      }
      throw result.error instanceof Error ? result.error : new Error(String(result.error));
    }
    return result?.data?.slos ?? [];
  } catch (e: unknown) {
    const status = typeof e === 'object' && e !== null && 'status' in e ? (e as { status?: number }).status : undefined;
    if (status === 404) {
      return [];
    }
    throw e;
  }
}

export function useAllSLOs() {
  const { slo } = useExternalDependencies();
  const pluginInstalled = slo.installed;
  const pluginCheckLoading = slo.isLoading;

  const { functions, isLoading: functionsLoading } = usePluginFunctions<() => Promise<GrafanaSLOPluginApi>>({
    extensionPointId: SLO_APP_API_EXTENSION_POINT_ID,
  });

  const listFn = functions[0]?.fn;
  const canFetch = pluginInstalled && !functionsLoading && typeof listFn === 'function';

  const query = useQuery({
    queryKey: [...sloQueryKeys.all, listFn],
    queryFn: () => {
      if (!listFn) {
        return Promise.resolve<SLO[]>([]);
      }
      return fetchSLOsList(listFn);
    },
    enabled: canFetch,
  });

  return {
    slos: query.data ?? [],
    isLoading: pluginCheckLoading || functionsLoading || (canFetch && query.isLoading),
    error: query.error instanceof Error ? query.error : query.error ? new Error(String(query.error)) : undefined,
  };
}

export function useSLOCheckLinkMap() {
  const { slos, isLoading: slosLoading, error: slosError } = useAllSLOs();
  const { data: checks, isLoading: checksLoading, error: checksError } = useChecks();

  const map = useMemo(
    () => buildSLOCheckLinkMap(slos, checks ?? []),
    [slos, checks]
  );

  return {
    map,
    isLoading: slosLoading || checksLoading,
    error: slosError ?? (checksError instanceof Error ? checksError : undefined),
  };
}

export function useSLOsForCheck(checkId: number | undefined) {
  const { map, isLoading, error } = useSLOCheckLinkMap();
  const slos = checkId !== undefined ? (map.slosByCheckId.get(checkId) ?? []) : [];
  return { slos, isLoading, error };
}

export function useChecksForSLO(sloUuid: string) {
  const { map, isLoading, error } = useSLOCheckLinkMap();
  const checks = map.checksBySLOUuid.get(sloUuid) ?? [];
  return { checks, isLoading, error };
}

function useSLOPluginApi() {
  const { functions, isLoading } = usePluginFunctions<() => Promise<GrafanaSLOPluginApi>>({
    extensionPointId: SLO_APP_API_EXTENSION_POINT_ID,
  });
  return { listFn: functions[0]?.fn, isLoading };
}

export function useUpdateSLO() {
  const { listFn } = useSLOPluginApi();

  return useCallback(
    async (payload: SLO): Promise<SLOPluginUpdateResult> => {
      if (!listFn) {
        return { error: new Error('SLO plugin API is not available') };
      }
      const api = await listFn();
      if (typeof api.updateSlo !== 'function') {
        return { error: new Error('SLO plugin API does not support updateSlo') };
      }
      return api.updateSlo(payload);
    },
    [listFn]
  );
}

export function useDeleteSLO() {
  const { listFn } = useSLOPluginApi();

  return useCallback(
    async (uuid: string): Promise<SLOPluginDeleteResult> => {
      if (!listFn) {
        return { error: new Error('SLO plugin API is not available') };
      }
      const api = await listFn();
      if (typeof api.deleteSlo !== 'function') {
        return { error: new Error('SLO plugin API does not support deleteSlo') };
      }
      return api.deleteSlo(uuid);
    },
    [listFn]
  );
}

