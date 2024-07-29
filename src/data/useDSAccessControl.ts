import { useQuery } from '@tanstack/react-query';
import { getBackendSrv } from '@grafana/runtime';
import { firstValueFrom } from 'rxjs';

import { DSAccessControlResponse } from 'datasource/responses.types';

export function useDSAccessControl(uid?: string) {
  return useQuery({
    queryKey: [uid],
    queryFn: () => {
      if (!uid) {
        throw new Error('uid is required');
      }
      return queryDSAccessControl(uid);
    },
    enabled: Boolean(uid),
  });
}

export function queryDSAccessControl(uid: string) {
  return firstValueFrom(
    getBackendSrv().fetch<DSAccessControlResponse>({
      method: `GET`,
      url: `/api/datasources/uid/${uid}?accesscontrol=true`,
    })
  ).then((res) => res.data);
}
