import { useMemo } from 'react';

import { useMeta } from 'hooks/useMeta';

import { SecretsManagerClient } from './SecretsManagerClient';

export interface SecretsManagerClientContext {
  client: SecretsManagerClient;
  stackId: number;
}

/**
 * Hook that provides a memoized `SecretsManagerClient` bound to the current
 * stack. Returns `undefined` until the plugin meta has a stackId available.
 *
 * The `stackId` is returned alongside the client so consumers can build
 * stack-scoped cache keys without needing to inspect the client instance.
 */
export function useSecretsManagerClient(): SecretsManagerClientContext | undefined {
  const { jsonData } = useMeta();
  const stackId = jsonData?.stackId;

  return useMemo(() => {
    if (typeof stackId !== 'number' || !Number.isFinite(stackId)) {
      return undefined;
    }
    return { client: new SecretsManagerClient(stackId), stackId };
  }, [stackId]);
}
