import { useQuery } from '@tanstack/react-query';
import { getBackendSrv } from '@grafana/runtime';

export function useDSAccessControl(uid: string) {
  return useQuery({
    queryKey: [uid],
    queryFn: () => getBackendSrv().get(`/api/datasources/uid/${uid}?accesscontrol=true`),
    select: (data) => {
      return data.accessControl;
    },
  });
}
