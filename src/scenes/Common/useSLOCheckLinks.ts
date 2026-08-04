import { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usePluginFunctions } from '@grafana/runtime';

import type { SLO, SLOApiV1 } from './useSLOCheckLinks.types';
import { useExternalDependencies } from 'contexts/ExternalDependenciesContext';
import { useChecks } from 'data/useChecks';

import { SLO_APP_API_EXTENSION_POINT_ID } from './useSLOCheckLinks.constants';
import { buildSLOCheckLinkMap } from './useSLOCheckLinks.utils';

export const sloQueryKeys = {
  all: ['slos'] as const,
};

/** The SLO app registers a getter that resolves to the API object, not the API itself. */
type GetSLOApi = () => Promise<SLOApiV1>;

export type SLOPluginUpdateResult = {
  error?: Error;
};

export type SLOPluginDeleteResult = {
  data?: { uuid: string };
  error?: Error;
};

function getErrorStatus(e: unknown): number | undefined {
  return typeof e === 'object' && e !== null && 'status' in e ? (e as { status?: number }).status : undefined;
}

/** `instanceof Error` is unreliable across plugin bundle boundaries, so duck-type the message. */
function toError(e: unknown): Error {
  if (e instanceof Error) {
    return e;
  }
  if (typeof e === 'object' && e !== null && 'message' in e) {
    return new Error(String((e as { message?: unknown }).message));
  }
  return new Error(String(e));
}

async function fetchSLOsList(getSLOApi: GetSLOApi): Promise<SLO[]> {
  try {
    const api = await getSLOApi();
    const { slos } = await api.getSlos();
    return slos ?? [];
  } catch (e: unknown) {
    // The SLO API 404s for tenants that have never had SLOs provisioned.
    if (getErrorStatus(e) === 404) {
      return [];
    }
    throw e;
  }
}

export function useAllSLOs() {
  const { slo } = useExternalDependencies();
  const pluginInstalled = slo.installed;
  const pluginCheckLoading = slo.isLoading;

  const { functions, isLoading: functionsLoading } = usePluginFunctions<GetSLOApi>({
    extensionPointId: SLO_APP_API_EXTENSION_POINT_ID,
  });

  const getSLOApi = functions[0]?.fn;
  const canFetch = pluginInstalled && !functionsLoading && typeof getSLOApi === 'function';

  const query = useQuery({
    queryKey: [...sloQueryKeys.all, getSLOApi],
    queryFn: () => {
      if (!getSLOApi) {
        return Promise.resolve<SLO[]>([]);
      }
      return fetchSLOsList(getSLOApi);
    },
    enabled: canFetch,
  });

  return {
    slos: query.data ?? [],
    isLoading: pluginCheckLoading || functionsLoading || (canFetch && query.isLoading),
    error: query.error ? toError(query.error) : undefined,
  };
}

export function useSLOCheckLinkMap() {
  const { slos, isLoading: slosLoading, error: slosError } = useAllSLOs();
  const { data: checks, isLoading: checksLoading, error: checksError } = useChecks();

  const map = useMemo(() => buildSLOCheckLinkMap(slos, checks ?? []), [slos, checks]);

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
  const { functions, isLoading } = usePluginFunctions<GetSLOApi>({
    extensionPointId: SLO_APP_API_EXTENSION_POINT_ID,
  });
  return { getSLOApi: functions[0]?.fn, isLoading };
}

export function useUpdateSLO() {
  const { getSLOApi } = useSLOPluginApi();

  return useCallback(
    async (payload: SLO): Promise<SLOPluginUpdateResult> => {
      if (!getSLOApi) {
        return { error: new Error('SLO plugin API is not available') };
      }
      try {
        const api = await getSLOApi();
        // The installed SLO app may predate this method even though it registers `slo-api/v1`.
        if (typeof api.updateSlo !== 'function') {
          return { error: new Error('SLO plugin API does not support updateSlo') };
        }
        await api.updateSlo(payload);
        return {};
      } catch (e: unknown) {
        return { error: toError(e) };
      }
    },
    [getSLOApi]
  );
}

export function useDeleteSLO() {
  const { getSLOApi } = useSLOPluginApi();

  return useCallback(
    async (uuid: string): Promise<SLOPluginDeleteResult> => {
      if (!getSLOApi) {
        return { error: new Error('SLO plugin API is not available') };
      }
      try {
        const api = await getSLOApi();
        // The installed SLO app may predate this method even though it registers `slo-api/v1`.
        if (typeof api.deleteSlo !== 'function') {
          return { error: new Error('SLO plugin API does not support deleteSlo') };
        }
        return { data: await api.deleteSlo(uuid) };
      } catch (e: unknown) {
        return { error: toError(e) };
      }
    },
    [getSLOApi]
  );
}
