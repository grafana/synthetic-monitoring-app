import { useQuery } from '@tanstack/react-query';
import { getBackendSrv } from '@grafana/runtime';
import { firstValueFrom } from 'rxjs';

import { useURLSearchParams } from './useURLSearchParams';

type SvalinnData = { script: string };
type SvalinnResponse = { ready: boolean; data: SvalinnData | null };
type SvalinnApiResponse = { id: number; description?: string; generated_at?: string };

const BASE_URL = '/api/plugins/grafana-irm-app/resources/svalinn';

async function fetchSvalinnScript(id: string): Promise<SvalinnResponse> {
  const resp = await firstValueFrom(
    getBackendSrv().fetch<SvalinnApiResponse>({
      method: 'GET',
      url: `${BASE_URL}/api/v1/suggestions/${id}`,
    })
  );
  if (resp.status === 200 && resp.data.description) {
    return { ready: true, data: { script: resp.data.description } };
  }
  return { ready: false, data: null };
}

export function useSvalinnScript() {
  const params = useURLSearchParams();
  const svalinnId = params.get('svalinn-id');
  const svalinnName = params.get('svalinn-name');
  const enabled = !!svalinnId;

  const { data, isFetching } = useQuery<SvalinnResponse>({
    queryKey: ['svalinn-script', svalinnId],
    queryFn: () => fetchSvalinnScript(svalinnId!),
    enabled,
    refetchInterval: (query) => (query.state.data?.ready ? false : 2000),
    staleTime: 0,
  });

  return {
    script: data?.ready ? (data.data?.script ?? null) : null,
    name: svalinnName,
    isLoading: enabled && (!data?.ready || isFetching),
    enabled,
  };
}
