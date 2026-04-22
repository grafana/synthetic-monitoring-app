import {
  SECRET_ANNOTATIONS,
  SecretResponseItem,
  SecretsListResponse,
} from 'data/clients/SecretsManagerClient/SecretsManagerClient.types';
import { SM_SECRET_DECRYPTER } from 'data/clients/SecretsManagerClient/constants';

import { SecretWithMetadata } from '../../page/ConfigPageLayout/tabs/SecretsManagementTab';
import { SM_META } from './meta';

const STACK_ID = SM_META.jsonData.stackId;

function makeAnnotations(createdBy: string, updatedBy: string, updatedTimestamp: string) {
  return {
    [SECRET_ANNOTATIONS.createdBy]: createdBy,
    [SECRET_ANNOTATIONS.updatedBy]: updatedBy,
    [SECRET_ANNOTATIONS.updatedTimestamp]: updatedTimestamp,
  };
}

/**
 * Raw k8s-shaped secure value resources as returned by the Grafana secrets API.
 * Used by MSW handlers to simulate the backend.
 *
 * All three items are scoped to `synthetic-monitoring` — they represent what
 * the server would return after applying the `spec.decrypter` fieldSelector.
 */
export const MOCKED_SECURE_VALUE_ITEMS: SecretResponseItem[] = [
  {
    metadata: {
      name: 'test-secret-1',
      namespace: `stacks-${STACK_ID}`,
      uid: 'secret-1',
      resourceVersion: '1',
      creationTimestamp: '1970-01-01T00:00:00Z',
      labels: { env: 'prod', type: 'test' },
      annotations: makeAnnotations('user1', 'user1', '1970-01-01T00:00:00Z'),
    },
    spec: {
      description: 'Test Description 1',
      decrypters: [SM_SECRET_DECRYPTER],
    },
  },
  {
    metadata: {
      name: 'test-secret-2',
      namespace: `stacks-${STACK_ID}`,
      uid: 'secret-2',
      resourceVersion: '1',
      creationTimestamp: '1970-01-01T00:00:00Z',
      labels: { env: 'dev' },
      annotations: makeAnnotations('user2', 'user2', '1970-01-01T00:00:00Z'),
    },
    spec: {
      description: 'Test Description 2',
      decrypters: [SM_SECRET_DECRYPTER],
    },
  },
  {
    metadata: {
      name: 'test-secret-3',
      namespace: `stacks-${STACK_ID}`,
      uid: 'secret-3',
      resourceVersion: '1',
      creationTimestamp: '1970-01-01T00:00:00Z',
      annotations: makeAnnotations('user3', 'user3', '1970-01-01T00:00:00Z'),
    },
    spec: {
      description: 'Test Description 3 - No labels',
      decrypters: [SM_SECRET_DECRYPTER],
    },
  },
];

/**
 * Raw k8s list response returned by `GET .../securevalues`.
 */
export const MOCKED_SECURE_VALUES_API_RESPONSE: SecretsListResponse = {
  apiVersion: 'secret.grafana.app/v1beta1',
  kind: 'SecureValueList',
  metadata: {},
  items: MOCKED_SECURE_VALUE_ITEMS,
};

/**
 * Normalized secrets used by UI-level tests to assert the shape consumers see.
 *
 * Kept in sync with {@link MOCKED_SECURE_VALUE_ITEMS} so that hitting the
 * mocked API yields these values after normalization.
 */
export const MOCKED_SECRETS: SecretWithMetadata[] = [
  {
    uuid: 'secret-1',
    name: 'test-secret-1',
    description: 'Test Description 1',
    created_at: 0,
    created_by: 'user1',
    labels: [
      { name: 'env', value: 'prod' },
      { name: 'type', value: 'test' },
    ],
    decrypters: [SM_SECRET_DECRYPTER],
    modified_at: 0,
    org_id: 0,
    stack_id: STACK_ID,
  },
  {
    uuid: 'secret-2',
    name: 'test-secret-2',
    description: 'Test Description 2',
    created_at: 0,
    created_by: 'user2',
    labels: [{ name: 'env', value: 'dev' }],
    decrypters: [SM_SECRET_DECRYPTER],
    modified_at: 0,
    org_id: 0,
    stack_id: STACK_ID,
  },
  {
    uuid: 'secret-3',
    name: 'test-secret-3',
    description: 'Test Description 3 - No labels',
    created_at: 0,
    created_by: 'user3',
    labels: [],
    decrypters: [SM_SECRET_DECRYPTER],
    modified_at: 0,
    org_id: 0,
    stack_id: STACK_ID,
  },
];
