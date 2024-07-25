import { CREATE_ACCESS_TOKEN } from 'test/fixtures/tokens';

import { ApiEntry } from 'test/handlers/types';
import { AccessTokenResponse } from 'datasource/responses.types';

export const createAccessToken: ApiEntry<AccessTokenResponse> = {
  route: `/sm/token/create`,
  method: `post`,
  result: (req) => {
    return {
      json: {
        msg: `token created`,
        token: CREATE_ACCESS_TOKEN,
      },
    };
  },
};
