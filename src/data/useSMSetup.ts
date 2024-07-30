import { QueryKey } from '@tanstack/query-core';
import { useMutation, UseMutationResult, useQuery } from '@tanstack/react-query';
import { getBackendSrv, getDataSourceSrv } from '@grafana/runtime';
import { firstValueFrom } from 'rxjs';

import { MutationProps } from './types';
import { FaroEvent } from 'faro';
import { SMDataSource } from 'datasource/DataSource';
import { SMPluginInstallResponse } from 'datasource/responses.types';
import { LinkedDatasourceInfo } from 'datasource/types';

export const queryKeys: Record<'list', QueryKey> = {
  list: ['get-sm-datasource'],
};

export const THE_ONE_AND_ONLY_SM_DS = `Synthetic Monitoring`;

export function useGetSMDatasource() {
  return useQuery({
    queryKey: queryKeys.list,
    queryFn: () => getDataSourceSrv().get(THE_ONE_AND_ONLY_SM_DS) as Promise<SMDataSource>,
  });
}

interface GetAccessTokenPayload {
  data: {
    stackId: number;
    metricsInstanceId: number;
    logsInstanceId: number;
  };
  id: string;
}

export function useSMAccessToken({ eventInfo }: MutationProps<any> = {}) {
  const eventType = FaroEvent.INITIALIZE_ACCESS_TOKEN;

  return useMutation<SMPluginInstallResponse, Error, GetAccessTokenPayload, UseMutationResult>({
    mutationFn: ({ data, id }) => {
      return firstValueFrom(
        getBackendSrv().fetch<SMPluginInstallResponse>({
          method: 'POST',
          url: `api/plugin-proxy/${id}/install`,
          data,
        })
      ).then((res) => res.data);
    },
    meta: {
      event: {
        info: eventInfo,
        type: eventType,
      },
    },
  });
}

interface SMPayload {
  accessToken: string;
  apiHost: string;
  logs: LinkedDatasourceInfo;
  name: string;
  metrics: LinkedDatasourceInfo;
}

export function useCreateSMDatasource({ eventInfo }: MutationProps<any> = {}) {
  const eventType = FaroEvent.INIT_SM;

  return useMutation({
    mutationFn: ({ accessToken, apiHost, logs, name, metrics }: SMPayload) =>
      firstValueFrom(
        getBackendSrv().fetch({
          method: 'POST',
          url: 'api/datasources',
          data: {
            name,
            type: 'synthetic-monitoring-datasource',
            access: 'proxy',
            isDefault: false,
            jsonData: {
              apiHost,
              initialized: true,
              metrics,
              logs,
            },
            secureJsonData: {
              accessToken,
            },
          },
        })
      ),
    meta: {
      event: {
        info: eventInfo,
        type: eventType,
      },
    },
  });
}

interface UpdateSMPayload extends SMPayload {
  id: number;
}

export function useUpdateSMDatasource({ eventInfo }: MutationProps<any> = {}) {
  const eventType = FaroEvent.UPDATE_SM_DS;

  return useMutation({
    mutationFn: ({ accessToken, apiHost, id, logs, name, metrics }: UpdateSMPayload) =>
      firstValueFrom(
        getBackendSrv().fetch({
          method: 'PUT',
          url: `api/datasources/${id}`,
          data: {
            name,
            type: 'synthetic-monitoring-datasource',
            access: 'proxy',
            isDefault: false,
            jsonData: {
              apiHost,
              initialized: true,
              metrics,
              logs,
            },
            secureJsonData: {
              accessToken,
            },
          },
        })
      ),
    meta: {
      event: {
        info: eventInfo,
        type: eventType,
      },
    },
  });
}
