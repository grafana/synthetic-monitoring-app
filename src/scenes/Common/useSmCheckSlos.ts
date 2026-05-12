import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usePluginFunctions } from '@grafana/runtime';

import type { Slo } from './useSmCheckSlos.types';
import { useExternalDependencies } from 'contexts/ExternalDependenciesContext';

import { SLO_APP_API_EXTENSION_POINT_ID } from './useSmCheckSlos.constants';
import { getMatchingSlosForSmCheck } from './useSmCheckSlos.utils';

export const smCheckSlosQueryKeys = {
  all: ['sm-check-slos'] as const,
  matches: (checkId: string) => [...smCheckSlosQueryKeys.all, checkId] as const,
};

export type SloPluginUpdateResult = {
  data?: Slo;
  error?: unknown;
};

export type SloPluginDeleteResult = {
  data?: unknown;
  error?: unknown;
};

export type GrafanaSloPluginApi = {
  getSlos: () => Promise<{
    data?: { slos: Slo[] };
    error?: unknown;
  }>;
  updateSlo?: (slo: Slo) => Promise<SloPluginUpdateResult>;
  deleteSlo?: (uuid: string) => Promise<SloPluginDeleteResult>;
};

/** Adds `sm_check_id` and persists via SLO plugin `updateSlo` (drops client-only `readOnly`). */
export async function linkSloToCheck(
  slo: Slo,
  checkId: string,
  updateSlo: (payload: Slo) => Promise<SloPluginUpdateResult>
): Promise<SloPluginUpdateResult> {
  const labels = [...(slo.labels ?? []).filter((l) => l.key !== 'sm_check_id')];
  labels.push({ key: 'sm_check_id', value: checkId });
  const { readOnly: _readOnly, ...rest } = slo;
  return updateSlo({ ...rest, labels });
}

async function fetchSlosList(getApi: () => Promise<GrafanaSloPluginApi>): Promise<Slo[]> {
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

export function useSmCheckSlos(checkId: number | undefined, job: string) {
  const id = checkId !== undefined ? String(checkId) : '';
  const { slo } = useExternalDependencies();
  const pluginInstalled = slo.installed;
  const pluginCheckLoading = slo.isLoading;

  const { functions, isLoading: functionsLoading } = usePluginFunctions<() => Promise<GrafanaSloPluginApi>>({
    extensionPointId: SLO_APP_API_EXTENSION_POINT_ID,
  });

  const listFn = functions[0]?.fn;
  const canFetch = Boolean(id) && pluginInstalled && !functionsLoading && typeof listFn === 'function';

  const query = useQuery({
    queryKey: [...smCheckSlosQueryKeys.matches(id), listFn ?? 'pending'],
    queryFn: () => {
      if (!listFn) {
        return Promise.resolve<Slo[]>([]);
      }
      return fetchSlosList(listFn);
    },
    enabled: canFetch,
    select: (slos) => getMatchingSlosForSmCheck(slos, id, job),
  });

  const updateSlo = useCallback(
    async (payload: Slo): Promise<SloPluginUpdateResult> => {
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

  const deleteSlo = useCallback(
    async (uuid: string): Promise<SloPluginDeleteResult> => {
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

  return {
    slos: query.data ?? [],
    isLoading: pluginCheckLoading || functionsLoading || (canFetch && query.isLoading),
    error: query.error instanceof Error ? query.error : query.error ? new Error(String(query.error)) : undefined,
    updateSlo,
    deleteSlo,
  };
}
