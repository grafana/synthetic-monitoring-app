import { SECRET_ANNOTATIONS, SecretResponseItem } from './SecretsManagerClient.types';
import { SecretFormValues } from 'page/ConfigPageLayout/tabs/SecretsManagementTab/SecretsManagementTab.utils';

import { SM_SECRET_DECRYPTER } from './constants';
import {
  CreateSecretFormValues,
  formValuesToCreatePayload,
  formValuesToUpdatePayload,
  normalizeSecret,
} from './SecretsManagerClient.utils';

function makeItem(overrides: Partial<SecretResponseItem['metadata']> = {}): SecretResponseItem {
  return {
    metadata: {
      name: 'my-secret',
      namespace: 'stacks-1',
      uid: 'uid-123',
      resourceVersion: '1',
      creationTimestamp: '2024-01-02T03:04:05Z',
      labels: { env: 'prod', type: 'api-key' },
      annotations: {
        [SECRET_ANNOTATIONS.createdBy]: 'user:1',
        [SECRET_ANNOTATIONS.updatedBy]: 'user:2',
        [SECRET_ANNOTATIONS.updatedTimestamp]: '2024-02-02T03:04:05Z',
      },
      ...overrides,
    },
    spec: {
      description: 'a secret',
      decrypters: [SM_SECRET_DECRYPTER],
    },
  };
}

describe('normalizeSecret', () => {
  it('maps metadata, spec and annotations onto SecretWithMetadata', () => {
    const result = normalizeSecret(makeItem(), 42);

    expect(result).toEqual({
      uuid: 'uid-123',
      name: 'my-secret',
      description: 'a secret',
      labels: [
        { name: 'env', value: 'prod' },
        { name: 'type', value: 'api-key' },
      ],
      decrypters: [SM_SECRET_DECRYPTER],
      created_at: Date.parse('2024-01-02T03:04:05Z'),
      modified_at: Date.parse('2024-02-02T03:04:05Z'),
      created_by: 'user:1',
      org_id: 0,
      stack_id: 42,
    });
  });

  it('falls back to creationTimestamp when updatedTimestamp annotation is missing', () => {
    const result = normalizeSecret(
      makeItem({
        annotations: { [SECRET_ANNOTATIONS.createdBy]: 'user:1' },
      }),
      1
    );
    expect(result.modified_at).toBe(Date.parse('2024-01-02T03:04:05Z'));
  });

  it('handles missing labels and annotations gracefully', () => {
    const result = normalizeSecret(
      makeItem({ labels: undefined, annotations: undefined }),
      1
    );
    expect(result.labels).toEqual([]);
    expect(result.created_by).toBe('');
  });

  it('exposes the full decrypter list so it can be echoed back on update', () => {
    const item = makeItem();
    item.spec.decrypters = [SM_SECRET_DECRYPTER, 'some-other-service'];
    expect(normalizeSecret(item, 1).decrypters).toEqual([SM_SECRET_DECRYPTER, 'some-other-service']);
  });

  it('defaults decrypters to an empty array when the API omits them', () => {
    const item = makeItem();
    delete item.spec.decrypters;
    expect(normalizeSecret(item, 1).decrypters).toEqual([]);
  });
});

describe('formValuesToCreatePayload', () => {
  const baseValues: CreateSecretFormValues = {
    name: 'new-secret',
    description: 'description',
    labels: [{ name: 'env', value: 'prod' }],
    plaintext: 'p@ssw0rd',
  };

  it('builds a k8s-shaped create payload from form values', () => {
    expect(formValuesToCreatePayload(baseValues)).toEqual({
      metadata: {
        name: 'new-secret',
        labels: { env: 'prod' },
      },
      spec: {
        description: 'description',
        decrypters: [SM_SECRET_DECRYPTER],
        value: 'p@ssw0rd',
      },
    });
  });

  it('always injects the synthetic-monitoring decrypter on create', () => {
    const payload = formValuesToCreatePayload(baseValues);
    expect(payload.spec.decrypters).toEqual([SM_SECRET_DECRYPTER]);
  });

  it('omits labels when none are provided', () => {
    const payload = formValuesToCreatePayload({ ...baseValues, labels: [] });
    expect(payload.metadata).not.toHaveProperty('labels');
  });
});

describe('formValuesToUpdatePayload', () => {
  const baseValues: SecretFormValues = {
    uuid: 'uid-1',
    name: 'existing-secret',
    description: 'updated description',
    labels: [{ name: 'env', value: 'prod' }],
  };

  it('builds a k8s-shaped update payload from form values', () => {
    expect(formValuesToUpdatePayload(baseValues, [SM_SECRET_DECRYPTER])).toEqual({
      metadata: {
        name: 'existing-secret',
        labels: { env: 'prod' },
      },
      spec: {
        description: 'updated description',
        decrypters: [SM_SECRET_DECRYPTER],
      },
    });
  });

  it('echoes back the existing decrypters verbatim to preserve user-managed decrypter lists', () => {
    const decrypters = [SM_SECRET_DECRYPTER, 'some-other-service'];
    const payload = formValuesToUpdatePayload(baseValues, decrypters);
    expect(payload.spec.decrypters).toEqual(decrypters);
  });

  it('only includes spec.value when plaintext is provided', () => {
    const withValue = formValuesToUpdatePayload(
      { ...baseValues, plaintext: 'new-value' },
      [SM_SECRET_DECRYPTER]
    );
    const withoutValue = formValuesToUpdatePayload(baseValues, [SM_SECRET_DECRYPTER]);

    expect(withValue.spec.value).toBe('new-value');
    expect(withoutValue.spec).not.toHaveProperty('value');
  });

  it('sends an empty label record when all labels are removed', () => {
    const payload = formValuesToUpdatePayload({ ...baseValues, labels: [] }, [SM_SECRET_DECRYPTER]);
    expect(payload.metadata.labels).toEqual({});
  });
});
