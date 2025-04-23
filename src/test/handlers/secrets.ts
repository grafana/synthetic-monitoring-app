import { ApiEntry } from './types';

import { SecretsResponse } from '../../data/useSecrets';
import { MOCKED_SECRETS_API_RESPONSE } from '../fixtures/secrets';

export const secrets: ApiEntry<SecretsResponse> = {
  route: `/api/v1alpha1/secrets`,
  method: `get`,
  result: () => {
    return {
      json: MOCKED_SECRETS_API_RESPONSE,
    };
  },
};
