import { useMutation, useQuery } from '@tanstack/react-query';

import { Label } from 'types';
import { SMDataSource } from 'datasource/DataSource';
import { useSMDS } from 'hooks/useSMDS';

import { SECRETS_EDIT_MODE_ADD } from '../page/ConfigPageLayout/tabs/SecretsManagementTab/constants';
import { SecretFormValues } from '../page/ConfigPageLayout/tabs/SecretsManagementTab/SecretsManagementTab.utils';
import { queryClient } from './queryClient';

export interface ExperimentalSecret {
  name: string;
  description: string;
  labels: Label[];
  uuid: string;
  org_id: number;
  stack_id: number;
  created_by: string;
  created_at: number;
  modified_at: number;
}

export interface ExperimentalSecretsResponse {
  secrets: ExperimentalSecret[];
}

export const queryKeys = {
  list: ['secrets'],
  byId: (id: string) => ['secrets', id],
};

function secretsQuery(api: SMDataSource) {
  return {
    queryKey: queryKeys.list,
    queryFn: () => api.getSecrets(),
    select: (data: ExperimentalSecretsResponse) => {
      return data?.secrets ?? [];
    },
  };
}

export function useSecrets() {
  const smDS = useSMDS();

  return useQuery<ExperimentalSecretsResponse, unknown, ExperimentalSecret[]>(secretsQuery(smDS));
}

export function useSecret(id?: string) {
  const smDS = useSMDS();

  return useQuery<ExperimentalSecret, unknown, ExperimentalSecret>({
    queryKey: queryKeys.byId(id!),
    queryFn: () => smDS.getSecret(id!),
    enabled: !!id && id !== SECRETS_EDIT_MODE_ADD,
  });
}

export function useSaveSecret() {
  const smDS = useSMDS();

  return useMutation<ExperimentalSecret, unknown, SecretFormValues & { uuid?: string }>({
    mutationFn: (data) => {
      return smDS.saveSecret(data);
    },
    onSuccess: async (_data, secret) => {
      const { name, ...updatedData } = secret; // name cannot be changed
      await queryClient.setQueryData(queryKeys.byId(secret.uuid!), updatedData);
      await queryClient.invalidateQueries({ queryKey: queryKeys.list });
    },
  });
}

export function useDeleteSecret() {
  const smDS = useSMDS();

  return useMutation<unknown, unknown, string>({
    mutationFn: (id) => smDS.deleteSecret(id),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.list });
    },
  });
}
