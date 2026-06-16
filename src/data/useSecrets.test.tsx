import { renderHook, waitFor } from '@testing-library/react';
import { MOCKED_SECRETS, MOCKED_SECURE_VALUE_ITEMS } from 'test/fixtures/secrets';
import { apiRoute, getServerRequests } from 'test/handlers';
import { createWrapper } from 'test/render';
import { server } from 'test/server';

import { SM_SECRET_DECRYPTER } from 'data/clients/SecretsManagerClient';

import { QUERY_KEYS, useSaveSecret, useSecret } from './useSecrets';

const SECRET = MOCKED_SECRETS[0];
const SECRET_ITEM = MOCKED_SECURE_VALUE_ITEMS[0];

describe('useSaveSecret', () => {
  it('echoes back the cached secret decrypters on update (preserves user-managed decrypter list)', async () => {
    const existingDecrypters = [SM_SECRET_DECRYPTER, 'some-other-service'];
    server.use(
      apiRoute('getSecret', {
        result: () => ({
          status: 200,
          json: {
            ...SECRET_ITEM,
            spec: { ...SECRET_ITEM.spec, decrypters: existingDecrypters },
          },
        }),
      })
    );
    const { record, read } = getServerRequests();
    server.use(apiRoute('updateSecret', {}, record));
    const { Wrapper } = createWrapper();

    // Prime the context query cache via useSecret, matching the flow the
    // SecretEditModal uses when a user opens an existing secret.
    const { result: secretResult } = renderHook(() => useSecret(SECRET.name), { wrapper: Wrapper });
    await waitFor(() => expect(secretResult.current.isSuccess).toBe(true));

    const { result } = renderHook(() => useSaveSecret(), { wrapper: Wrapper });
    result.current.mutate({
      uuid: SECRET.uuid,
      name: SECRET.name,
      description: 'new description',
      labels: [],
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const { body } = await read();
    expect(body.spec.decrypters).toEqual(existingDecrypters);
  });

  it('fetches the current decrypters synchronously on update when the cache is empty', async () => {
    const existingDecrypters = [SM_SECRET_DECRYPTER, 'some-other-service'];
    server.use(
      apiRoute('getSecret', {
        result: () => ({
          status: 200,
          json: {
            ...SECRET_ITEM,
            spec: { ...SECRET_ITEM.spec, decrypters: existingDecrypters },
          },
        }),
      })
    );
    const { record, read } = getServerRequests();
    server.use(apiRoute('updateSecret', {}, record));
    const { Wrapper } = createWrapper();

    // Note: no useSecret() call — the cache is empty; the mutation must fetch
    // to discover the existing decrypters rather than guessing.
    const { result } = renderHook(() => useSaveSecret(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current).not.toBeNull());
    result.current.mutate({
      uuid: SECRET.uuid,
      name: SECRET.name,
      description: 'new description',
      labels: [],
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const { body } = await read();
    expect(body.spec.decrypters).toEqual(existingDecrypters);
  });

  it('fails the update when the current-decrypters fetch fails', async () => {
    server.use(
      apiRoute('getSecret', { result: () => ({ status: 500, json: { message: 'boom' } }) })
    );
    const { Wrapper } = createWrapper();

    const { result } = renderHook(() => useSaveSecret(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current).not.toBeNull());
    result.current.mutate({
      uuid: SECRET.uuid,
      name: SECRET.name,
      description: 'new description',
      labels: [],
    });

    // Better to surface the error than silently save with an incorrect decrypter list.
    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('always injects only synthetic-monitoring as the decrypter on create', async () => {
    const { record, read } = getServerRequests();
    server.use(apiRoute('createSecret', {}, record));
    const { Wrapper } = createWrapper();

    const { result } = renderHook(() => useSaveSecret(), { wrapper: Wrapper });
    await waitFor(() => expect(result.current).not.toBeNull());
    result.current.mutate({
      name: 'new-secret',
      description: 'description',
      labels: [],
      plaintext: 'value',
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const { body } = await read();
    expect(body.spec.decrypters).toEqual([SM_SECRET_DECRYPTER]);
  });

});

describe('QUERY_KEYS', () => {
  it('scopes list and byName keys by stackId to prevent cross-stack cache bleed', () => {
    expect(QUERY_KEYS.list(1)).toEqual(['secrets', 1]);
    expect(QUERY_KEYS.list(2)).toEqual(['secrets', 2]);
    expect(QUERY_KEYS.byName('foo', 1)).toEqual(['secrets', 1, 'foo']);
  });
});
