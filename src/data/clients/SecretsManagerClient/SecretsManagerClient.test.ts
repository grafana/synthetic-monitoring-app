import { apiRoute, getServerRequests } from 'test/handlers';
import { server } from 'test/server';

import { SECRETS_API_BASE, SM_SECRET_DECRYPTER } from './constants';
import { SecretsManagerClient } from './SecretsManagerClient';

const STACK_ID = 42;

function setupClient() {
  return new SecretsManagerClient(STACK_ID);
}

describe('SecretsManagerClient.fetchAll', () => {
  it('requests the securevalues endpoint with a spec.decrypter fieldSelector', async () => {
    const { record, read } = getServerRequests();
    server.use(
      apiRoute(
        'listSecrets',
        {
          result: () => ({
            status: 200,
            json: {
              apiVersion: 'secret.grafana.app/v1beta1',
              kind: 'SecureValueList',
              metadata: {},
              items: [],
            },
          }),
        },
        record
      )
    );

    await setupClient().fetchAll();

    const { request } = await read(undefined, false);
    const url = new URL(request.url);

    expect(url.pathname).toBe(`${SECRETS_API_BASE}/namespaces/stacks-${STACK_ID}/securevalues`);
    expect(url.searchParams.get('fieldSelector')).toBe(`spec.decrypter=${SM_SECRET_DECRYPTER}`);
  });

  it('normalizes every item the API returns (the server-side fieldSelector is trusted)', async () => {
    server.use(
      apiRoute('listSecrets', {
        result: () => ({
          status: 200,
          json: {
            apiVersion: 'secret.grafana.app/v1beta1',
            kind: 'SecureValueList',
            metadata: {},
            items: [
              {
                metadata: {
                  name: 'first',
                  namespace: `stacks-${STACK_ID}`,
                  uid: 'uid-1',
                  resourceVersion: '1',
                  creationTimestamp: '2024-01-01T00:00:00Z',
                },
                spec: { description: 'first', decrypters: [SM_SECRET_DECRYPTER] },
              },
              {
                metadata: {
                  name: 'second',
                  namespace: `stacks-${STACK_ID}`,
                  uid: 'uid-2',
                  resourceVersion: '1',
                  creationTimestamp: '2024-01-01T00:00:00Z',
                },
                spec: { description: 'second', decrypters: [SM_SECRET_DECRYPTER, 'other'] },
              },
            ],
          },
        }),
      })
    );

    const result = await setupClient().fetchAll();

    expect(result.map((s) => s.name)).toEqual(['first', 'second']);
  });
});

describe('SecretsManagerClient.createSecret', () => {
  it('POSTs a k8s-shaped create payload with synthetic-monitoring decrypter', async () => {
    const { record, read } = getServerRequests();
    server.use(apiRoute('createSecret', {}, record));

    await setupClient().createSecret({
      name: 'api-token',
      description: 'An API token',
      labels: [{ name: 'env', value: 'prod' }],
      plaintext: 'p@ss',
    });

    const { request, body } = await read();
    expect(request.method).toBe('POST');
    expect(new URL(request.url).pathname).toBe(
      `${SECRETS_API_BASE}/namespaces/stacks-${STACK_ID}/securevalues`
    );
    expect(body).toEqual({
      metadata: { name: 'api-token', labels: { env: 'prod' } },
      spec: {
        description: 'An API token',
        decrypters: [SM_SECRET_DECRYPTER],
        value: 'p@ss',
      },
    });
  });
});

describe('SecretsManagerClient.updateSecret', () => {
  it('PUTs a k8s-shaped update payload that echoes back the existing decrypters', async () => {
    const { record, read } = getServerRequests();
    server.use(apiRoute('updateSecret', {}, record));

    const existingDecrypters = [SM_SECRET_DECRYPTER, 'some-other-service'];
    await setupClient().updateSecret(
      {
        uuid: 'uid-1',
        name: 'api-token',
        description: 'Rotated token',
        labels: [{ name: 'env', value: 'prod' }],
        plaintext: 'new-value',
      },
      existingDecrypters
    );

    const { request, body } = await read();
    expect(request.method).toBe('PUT');
    expect(new URL(request.url).pathname).toBe(
      `${SECRETS_API_BASE}/namespaces/stacks-${STACK_ID}/securevalues/api-token`
    );
    expect(body).toEqual({
      metadata: { name: 'api-token', labels: { env: 'prod' } },
      spec: { description: 'Rotated token', decrypters: existingDecrypters, value: 'new-value' },
    });
  });
});

describe('SecretsManagerClient.deleteSecret', () => {
  it('DELETEs the named resource', async () => {
    const { record, read } = getServerRequests();
    server.use(apiRoute('deleteSecret', {}, record));

    await setupClient().deleteSecret('api-token');

    const { request } = await read(undefined, false);
    expect(request.method).toBe('DELETE');
    expect(new URL(request.url).pathname).toBe(
      `${SECRETS_API_BASE}/namespaces/stacks-${STACK_ID}/securevalues/api-token`
    );
  });
});
