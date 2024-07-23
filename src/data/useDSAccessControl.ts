import { useQuery } from '@tanstack/react-query';
import { WithAccessControlMetadata } from '@grafana/data';
import { getBackendSrv } from '@grafana/runtime';

export function useDSAccessControl(uid?: string) {
  return useQuery({
    queryKey: [uid],
    queryFn: () =>
      getBackendSrv().get<Required<WithAccessControlMetadata>>(`/api/datasources/uid/${uid}?accesscontrol=true`),
    select: (data) => {
      return Object.entries(data.accessControl)
        .filter(([_, value]) => Boolean(value))
        .map(([key]) => key);
    },
    enabled: Boolean(uid),
  });
}
