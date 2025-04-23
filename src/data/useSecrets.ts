import { useMutation, useQuery } from '@tanstack/react-query';

import { SMDataSource } from 'datasource/DataSource';
import { useSMDS } from 'hooks/useSMDS';
import { SecretWithMetadata } from 'page/ConfigPageLayout/tabs/SecretsManagementTab';
import { SECRETS_EDIT_MODE_ADD } from 'page/ConfigPageLayout/tabs/SecretsManagementTab/constants';
import { SecretFormValues } from 'page/ConfigPageLayout/tabs/SecretsManagementTab/SecretsManagementTab.utils';

import { queryClient } from './queryClient';

export interface SecretsResponse {
  secrets: SecretWithMetadata[];
}

export const queryKeys = {
  list: ['secrets'],
  byId: (id: string) => ['secrets', id],
};

function secretsQuery(api: SMDataSource) {
  return {
    queryKey: queryKeys.list,
    queryFn: () => api.getSecrets(),
    throwOnError: true,
    select: (data: SecretsResponse) => {
      return data?.secrets ?? [];
    },
  };
}

/**
 * Hook to fetch secrets
 *
 * @throws {Error} If the query fails - Use ErrorBoundary to catch errors
 */
export function useSecrets() {
  const smDS = useSMDS();

  return useQuery<SecretsResponse, unknown, SecretWithMetadata[]>(secretsQuery(smDS));
}

/**
 * Hook to fetch a secret by id
 * @param {number} id
 * @throws {Error} If the query fails - Use ErrorBoundary to catch errors
 */
export function useSecret(id?: string) {
  const smDS = useSMDS();

  return useQuery<SecretWithMetadata, unknown, SecretWithMetadata>({
    queryKey: queryKeys.byId(id!),
    queryFn: () => smDS.getSecret(id!),
    enabled: !!id && id !== SECRETS_EDIT_MODE_ADD,
    throwOnError: true,
  });
}

/**
 * Hook to save a secret
 * @throws {Error} If the mutation fails - Use ErrorBoundary to catch errors
 */
export function useSaveSecret() {
  const smDS = useSMDS();

  return useMutation<SecretWithMetadata, unknown, SecretFormValues & { uuid?: string }>({
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

/**
 * Hook to delete a secret
 * @throws {Error} If the mutation fails - Use ErrorBoundary to catch errors
 */
export function useDeleteSecret() {
  const smDS = useSMDS();

  return useMutation<unknown, unknown, string>({
    mutationFn: (id) => smDS.deleteSecret(id),
    onSuccess: async (_data) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.list });
    },
    throwOnError: true,
  });
}
