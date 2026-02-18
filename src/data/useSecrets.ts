import { useMutation, useQuery } from '@tanstack/react-query';

import { SMDataSource } from 'datasource/DataSource';
import { useSMDS } from 'hooks/useSMDS';
import { SecretWithMetadata } from 'page/ConfigPageLayout/tabs/SecretsManagementTab';
import { SECRETS_EDIT_MODE_ADD } from 'page/ConfigPageLayout/tabs/SecretsManagementTab/constants';
import { SecretFormValues } from 'page/ConfigPageLayout/tabs/SecretsManagementTab/SecretsManagementTab.utils';

import { QUERY_CLIENT } from './queryClient';

export interface SecretsResponse {
  secrets: SecretWithMetadata[];
}

export const QUERY_KEYS = {
  list: ['secrets'],
  byName: (name: string) => ['secrets', name],
};

function secretsQuery(api: SMDataSource) {
  return {
    queryKey: QUERY_KEYS.list,
    queryFn: () => api.getSecrets(),
    throwOnError: true,
    select: (data: SecretsResponse) => {
      return (data?.secrets ?? []).map(secret => ({ ...secret, labels: secret.labels ?? [] }));
    },
  };
}

/**
 * Hook to fetch secrets
 *
 * @param {boolean} enabled - Whether the query should be enabled
 * @throws {Error} If the query fails - Use ErrorBoundary to catch errors
 */
export function useSecrets(enabled: boolean) {
  const smDS = useSMDS();

  return useQuery<SecretsResponse, unknown, SecretWithMetadata[]>({
    ...secretsQuery(smDS),
    enabled,
  });
}

/**
 * Hook to fetch a secret by name
 * @param {string} name
 * @throws {Error} If the query fails - Use ErrorBoundary to catch errors
 */
export function useSecret(name?: string) {
  const smDS = useSMDS();

  return useQuery<SecretWithMetadata, unknown, SecretWithMetadata>({
    queryKey: QUERY_KEYS.byName(name!),
    queryFn: () => smDS.getSecret(name!),
    enabled: !!name && name !== SECRETS_EDIT_MODE_ADD,
    select: (secret) => ({ ...secret, labels: secret.labels ?? [] }),
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
      await QUERY_CLIENT.setQueryData(QUERY_KEYS.byName(secret.name!), updatedData);
      await QUERY_CLIENT.invalidateQueries({ queryKey: QUERY_KEYS.list });
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
    mutationFn: (name) => smDS.deleteSecret(name),
    onSuccess: async (_data) => {
      await QUERY_CLIENT.invalidateQueries({ queryKey: QUERY_KEYS.list });
    },
    throwOnError: true,
  });
}
