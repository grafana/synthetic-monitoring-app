import { useQuery } from '@tanstack/react-query';
import { getBackendSrv } from '@grafana/runtime';
import { firstValueFrom } from 'rxjs';

import { useURLSearchParams } from './useURLSearchParams';

type SvalinnData = { script: string };
type SvalinnResponse = { ready: boolean; data: SvalinnData | null; error?: string };
type SvalinnApiResponse = { id: number; script?: string; generated_at?: string };

const BASE_URL = '/api/plugins/grafana-irm-app/resources/svalinn';

async function fetchSvalinnScript(id: string): Promise<SvalinnResponse> {
  try {
    const resp = await firstValueFrom(
      getBackendSrv().fetch<SvalinnApiResponse>({
        method: 'GET',
        url: `${BASE_URL}/api/v1/suggestions/${id}`,
      })
    );
    if (resp.status === 200 && resp.data.script) {
      return { ready: true, data: { script: resp.data.script } };
    }
    return { ready: false, data: null };
  } catch (err: unknown) {
    const status = (err as { status?: number })?.status;
    if (status === 404) {
      return { ready: false, data: null, error: 'Failed to generate script' };
    }
    throw err;
  }
}

export function useSvalinnScript() {
  const params = useURLSearchParams();
  const svalinnId = params.get('svalinn-id');
  const svalinnName = params.get('svalinn-name');
  const enabled = !!svalinnId;

  const { data } = useQuery<SvalinnResponse>({
    queryKey: ['svalinn-script', svalinnId],
    queryFn: () => fetchSvalinnScript(svalinnId!),
    enabled,
    refetchInterval: (query) => (query.state.data?.ready || query.state.data?.error ? false : 2000),
    staleTime: 0,
  });

  const error = data?.error ?? null;

  return {
    script: data?.ready ? (data.data?.script ?? null) : null,
    name: svalinnName,
    isLoading: enabled && !data?.ready && !error,
    error,
    enabled,
  };
}
