import { useQuery } from '@tanstack/react-query';
import { getBackendSrv } from '@grafana/runtime';
import { firstValueFrom } from 'rxjs';

import { useURLSearchParams } from './useURLSearchParams';

type SvalinnData = { script: string };
type SvalinnResponse = { ready: boolean; data: SvalinnData | null };

async function fetchSvalinnScript(id: string): Promise<SvalinnResponse> {
  const resp = await firstValueFrom(
    getBackendSrv().fetch<unknown>({
      method: 'GET',
      url: `https://dev.grafana-dev.net/api/plugins/grafana-synthetic-monitoring-app/settings`,
    })
  );
  return { ready: true, data: { script: JSON.stringify(resp.data, null, 2) } };
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
