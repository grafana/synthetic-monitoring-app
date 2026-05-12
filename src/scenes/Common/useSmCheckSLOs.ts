import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usePluginFunctions } from '@grafana/runtime';

import type { SLO } from './useSmCheckSLOs.types';
import { useExternalDependencies } from 'contexts/ExternalDependenciesContext';

import { SLO_APP_API_EXTENSION_POINT_ID } from './useSmCheckSLOs.constants';
import { getMatchingSLOsForSmCheck } from './useSmCheckSLOs.utils';

export const smCheckSLOsQueryKeys = {
  all: ['sm-check-slos'] as const,
  matches: (checkId: string) => [...smCheckSLOsQueryKeys.all, checkId] as const,
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

/** Adds `sm_check_id` and persists via SLO plugin `updateSlo` (drops client-only `readOnly`). */
export async function linkSLOToCheck(
  slo: SLO,
  checkId: string,
  updateSLO: (payload: SLO) => Promise<SLOPluginUpdateResult>
): Promise<SLOPluginUpdateResult> {
  const labels = [...(slo.labels ?? []).filter((l) => l.key !== 'sm_check_id')];
  labels.push({ key: 'sm_check_id', value: checkId });
  const { readOnly: _readOnly, ...rest } = slo;
  return updateSLO({ ...rest, labels });
}

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

export function useSmCheckSLOs(checkId: number | undefined, job: string) {
  const id = checkId !== undefined ? String(checkId) : '';
  const { slo } = useExternalDependencies();
  const pluginInstalled = slo.installed;
  const pluginCheckLoading = slo.isLoading;

  const { functions, isLoading: functionsLoading } = usePluginFunctions<() => Promise<GrafanaSLOPluginApi>>({
    extensionPointId: SLO_APP_API_EXTENSION_POINT_ID,
  });

  const listFn = functions[0]?.fn;
  const canFetch = Boolean(id) && pluginInstalled && !functionsLoading && typeof listFn === 'function';

  const query = useQuery({
    queryKey: [...smCheckSLOsQueryKeys.matches(id), listFn ?? 'pending'],
    queryFn: () => {
      if (!listFn) {
        return Promise.resolve<SLO[]>([]);
      }
      return fetchSLOsList(listFn);
    },
    enabled: canFetch,
    select: (slos) => getMatchingSLOsForSmCheck(slos, id, job),
  });

  const updateSLO = useCallback(
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

  const deleteSLO = useCallback(
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

  return {
    slos: query.data ?? [],
    isLoading: pluginCheckLoading || functionsLoading || (canFetch && query.isLoading),
    error: query.error instanceof Error ? query.error : query.error ? new Error(String(query.error)) : undefined,
    updateSLO,
    deleteSLO,
  };
}
