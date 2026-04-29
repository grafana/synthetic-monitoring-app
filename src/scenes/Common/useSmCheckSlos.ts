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

type GrafanaSloPluginApi = {
  getSlos: () => Promise<{
    data?: { slos: Slo[] };
    error?: unknown;
  }>;
};

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

  return {
    slos: query.data ?? [],
    isLoading: pluginCheckLoading || functionsLoading || (canFetch && query.isLoading),
    error: query.error instanceof Error ? query.error : query.error ? new Error(String(query.error)) : undefined,
  };
}
