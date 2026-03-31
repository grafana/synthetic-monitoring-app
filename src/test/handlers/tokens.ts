import { CREATE_ACCESS_TOKEN, LIST_ACCESS_TOKENS } from 'test/fixtures/tokens';

import { ApiEntry } from 'test/handlers/types';
import { AccessTokenResponse, ListTokensResponse } from 'datasource/responses.types';

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

export const listAccessTokens: ApiEntry<ListTokensResponse> = {
  route: `/sm/token/list`,
  method: `get`,
  result: () => ({
    json: LIST_ACCESS_TOKENS,
  }),
};

export const revokeAccessToken: ApiEntry<{ msg: string }> = {
  route: `/sm/token/([^/]+)`,
  method: `delete`,
  result: () => ({
    json: { msg: 'token revoked' },
  }),
};
