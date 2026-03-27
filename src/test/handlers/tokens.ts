import { CREATE_ACCESS_TOKEN, MOCK_TOKENS } from 'test/fixtures/tokens';

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
    json: {
      tokens: MOCK_TOKENS,
      totalCount: MOCK_TOKENS.length,
    },
  }),
};

export const deleteAccessToken: ApiEntry<{ msg: string }> = {
  route: /\/sm\/token\/\d+/,
  method: `delete`,
  result: () => ({
    json: { msg: `token deleted` },
  }),
};
