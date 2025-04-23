import { SecretsResponse } from '../../data/useSecrets';
import { SecretWithMetadata } from '../../page/ConfigPageLayout/tabs/SecretsManagementTab';

export const MOCKED_SECRETS: SecretWithMetadata[] = [
  {
    uuid: 'secret-1',
    name: 'Test Secret 1',
    description: 'Test Description 1',
    created_at: 0,
    created_by: 'user1',
    labels: [{ name: 'env', value: 'prod' }],
    modified_at: 0,
    org_id: 0,
    stack_id: 0,
  },
  {
    uuid: 'secret-2',
    name: 'Test Secret 2',
    description: 'Test Description 2',
    created_at: 0,
    created_by: 'user2',
    labels: [{ name: 'env', value: 'dev' }],
    modified_at: 0,
    org_id: 0,
    stack_id: 0,
  },
];

export const MOCKED_SECRETS_API_RESPONSE: SecretsResponse = {
  secrets: MOCKED_SECRETS,
};
