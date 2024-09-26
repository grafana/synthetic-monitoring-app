import { useQuery } from '@tanstack/react-query';
import { getBackendSrv } from '@grafana/runtime';
import { firstValueFrom } from 'rxjs';
import { INSTANCE_RESPONSE, ORG_RESPONSE } from 'test/fixtures/gcom';

import {
  InstanceResponse,
  OrgResponse,
  RelevantInstanceResponse,
  RelevantOrgResponse,
  UsageBillingDimensions,
} from './useGcom.types';

/*
How we are calling gcom is an ANTI-PATTERN. It's a bad idea to rely on another plugin to provide information for us
however we are adding this in temporarily so we can add this feature to SM.
An issue has been created to remove this dependency and add this feature directly to SM in the near future.
*/

const MOCK_LATENCY = 2000;

export function useGcomInstance() {
  return useQuery<RelevantInstanceResponse>({
    queryKey: [`gcom-instance`],
    queryFn: () => {
      if (process.env.NODE_ENV === 'development') {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(INSTANCE_RESPONSE);
          }, MOCK_LATENCY);
        });
      }

      return firstValueFrom(
        getBackendSrv().fetch<InstanceResponse>({
          url: `api/plugin-proxy/cloud-home-app/grafanacom-api/instance`,
          showErrorAlert: false,
        })
      ).then((res) => res.data);
    },
  });
}

export function useGcomOrg(orgSlugOrId?: string | number) {
  return useQuery<RelevantOrgResponse>({
    queryKey: [orgSlugOrId],
    queryFn: () => {
      if (process.env.NODE_ENV === 'development') {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(ORG_RESPONSE);
          }, MOCK_LATENCY);
        });
      }

      return firstValueFrom(
        getBackendSrv().fetch<OrgResponse>({
          url: `api/plugin-proxy/cloud-home-app/grafanacom-api/orgs/${orgSlugOrId}`,
          showErrorAlert: false,
        })
      ).then((res) => res.data);
    },
    enabled: Boolean(orgSlugOrId),
  });
}

// https://admin.grafana-dev.com/api-docs#/usage-billing/getOrgBillingDimensions
export function useGcomUsageBillingDimensions(orgSlugOrId?: string | number) {
  return useQuery({
    queryKey: [orgSlugOrId],
    queryFn: () => {
      return firstValueFrom(
        getBackendSrv().fetch<UsageBillingDimensions>({
          url: `usage-billing/orgs/${orgSlugOrId}/dimensions`,
          showErrorAlert: false,
        })
      ).then((res) => res.data);
    },
    enabled: Boolean(orgSlugOrId),
  });
}
