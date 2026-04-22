import { type QueryKey, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useSecretsManagerClient } from 'data/clients/SecretsManagerClient';
import { CreateSecretFormValues } from 'data/clients/SecretsManagerClient/SecretsManagerClient.utils';
import { SecretWithMetadata } from 'page/ConfigPageLayout/tabs/SecretsManagementTab';
import { SECRETS_EDIT_MODE_ADD } from 'page/ConfigPageLayout/tabs/SecretsManagementTab/constants';
import { SecretFormValues } from 'page/ConfigPageLayout/tabs/SecretsManagementTab/SecretsManagementTab.utils';

/**
 * React-query keys for secrets. All keys are scoped by `stackId` so multiple
 * stacks in the same session cannot share cache entries.
 */
export const QUERY_KEYS = {
  list: (stackId: number): QueryKey => ['secrets', stackId],
  byName: (name: string, stackId: number): QueryKey => ['secrets', stackId, name],
};

/**
 * Placeholder passed to `QUERY_KEYS` when the client is not yet available.
 * No data is ever stored at this key because queries are gated via `enabled`.
 */
const INACTIVE_STACK_ID = -1;

function isCreateSecretFormValues(values: SecretFormValues): values is CreateSecretFormValues {
  return typeof values.plaintext === 'string';
}

/**
 * Hook to fetch secrets
 *
 * @param {boolean} enabled - Whether the query should be enabled
 * @throws {Error} If the query fails - Use ErrorBoundary to catch errors
 */
export function useSecrets(enabled: boolean) {
  const ctx = useSecretsManagerClient();
  const stackId = ctx?.stackId ?? INACTIVE_STACK_ID;

  return useQuery<SecretWithMetadata[], unknown, SecretWithMetadata[]>({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps -- `ctx` is derived from stackId, which IS in the key
    queryKey: QUERY_KEYS.list(stackId),
    queryFn: () => ctx!.client.fetchAll(),
    throwOnError: true,
    enabled: enabled && Boolean(ctx),
    select: (secrets) => secrets.map((secret) => ({ ...secret, labels: secret.labels ?? [] })),
  });
}

/**
 * Hook to fetch a secret by name
 * @param {string} name
 * @throws {Error} If the query fails - Use ErrorBoundary to catch errors
 */
export function useSecret(name?: string) {
  const ctx = useSecretsManagerClient();
  const stackId = ctx?.stackId ?? INACTIVE_STACK_ID;

  return useQuery<SecretWithMetadata, unknown, SecretWithMetadata>({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps -- `ctx` is derived from stackId, which IS in the key
    queryKey: QUERY_KEYS.byName(name!, stackId),
    queryFn: () => ctx!.client.fetchSecret(name!),
    enabled: Boolean(ctx) && !!name && name !== SECRETS_EDIT_MODE_ADD,
    select: (secret) => ({ ...secret, labels: secret.labels ?? [] }),
  });
}

/**
 * Hook to save a secret
 * @throws {Error} If the mutation fails - Use ErrorBoundary to catch errors
 */
export function useSaveSecret() {
  const ctx = useSecretsManagerClient();
  const queryClient = useQueryClient();

  return useMutation<SecretWithMetadata, unknown, SecretFormValues & { uuid?: string }>({
    mutationFn: async (data) => {
      if (!ctx) {
        throw new Error('Secrets API is not available: missing stackId');
      }
      const { client, stackId } = ctx;

      if (!data.uuid) {
        if (!isCreateSecretFormValues(data)) {
          throw new Error('Cannot create a secret without a value');
        }
        return client.createSecret(data);
      }

      // When updating, we must echo back the secret's current decrypters so
      // SM does not accidentally drop the user-managed decrypter list. Pull
      // them from the react-query cache if present (populated by `useSecret`
      // when the edit modal opened); otherwise fetch them synchronously so
      // we never save with an incomplete decrypter set.
      const current = await queryClient.fetchQuery<SecretWithMetadata>({
        queryKey: QUERY_KEYS.byName(data.name, stackId),
        queryFn: () => client.fetchSecret(data.name),
      });
      return client.updateSecret(data, current.decrypters);
    },
    onSuccess: async (_data, secret) => {
      const stackId = ctx?.stackId ?? INACTIVE_STACK_ID;
      const { name, ...updatedData } = secret;
      await queryClient.setQueryData(QUERY_KEYS.byName(secret.name!, stackId), updatedData);
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.list(stackId) });
    },
  });
}

/**
 * Hook to delete a secret
 * @throws {Error} If the mutation fails - Use ErrorBoundary to catch errors
 */
export function useDeleteSecret() {
  const ctx = useSecretsManagerClient();
  const queryClient = useQueryClient();

  return useMutation<unknown, unknown, string>({
    mutationFn: (name) => {
      if (!ctx) {
        throw new Error('Secrets API is not available: missing stackId');
      }
      return ctx.client.deleteSecret(name);
    },
    onSuccess: async () => {
      const stackId = ctx?.stackId ?? INACTIVE_STACK_ID;
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.list(stackId) });
    },
    throwOnError: true,
  });
}
