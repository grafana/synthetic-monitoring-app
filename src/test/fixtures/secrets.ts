import { SecretsResponse } from '../../data/useSecrets';
import { SecretWithMetadata } from '../../page/ConfigPageLayout/tabs/SecretsManagementTab';

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
    ], // Important: This mock must have AT LEAST one label to be used in the test
    modified_at: 0,
    org_id: 0,
    stack_id: 0,
  },
  {
    uuid: 'secret-2',
    name: 'test-secret-2',
    description: 'Test Description 2',
    created_at: 0,
    created_by: 'user2',
    labels: [{ name: 'env', value: 'dev' }],
    modified_at: 0,
    org_id: 0,
    stack_id: 0,
  },
  {
    uuid: 'secret-3',
    name: 'test-secret-3',
    description: 'Test Description 3 - No labels',
    created_at: 0,
    created_by: 'user3',
    labels: [],
    modified_at: 0,
    org_id: 0,
    stack_id: 0,
  },
];

export const MOCKED_SECRETS_API_RESPONSE: SecretsResponse = {
  secrets: MOCKED_SECRETS,
};
