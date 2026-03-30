import { ListTokensResponse } from 'datasource/responses.types';

export const CREATE_ACCESS_TOKEN = `a lovely token`;

// Two mock tokens. currentTokenId=1 marks the active session token.
// Token id=2 appears first (more recently created).
export const LIST_ACCESS_TOKENS: ListTokensResponse = {
  totalCount: 2,
  currentTokenId: 1,
  tokens: [
    { id: 2, created: 1700000000000000000, lastUsed: 1740000000000000000 },
    { id: 1, created: 1690000000000000000, lastUsed: 1720000000000000000 },
  ],
};
