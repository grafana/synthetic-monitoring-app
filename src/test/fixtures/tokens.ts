import { ListTokensResponse } from 'datasource/responses.types';

export const CREATE_ACCESS_TOKEN = `a lovely token`;

// UUIDv7-style ids, listed newest first. CURRENT_TOKEN_ID marks the token the
// request authenticated with (the older, second row).
export const CURRENT_TOKEN_ID = `018b7d3a-0000-7000-8000-000000000001`;
export const OTHER_TOKEN_ID = `018f6f8e-0000-7000-8000-000000000002`;

export const LIST_ACCESS_TOKENS: ListTokensResponse = {
  items: [
    { id: OTHER_TOKEN_ID, created: 1700000000, lastUsed: 1740000000 }, // created 2023-11-14
    { id: CURRENT_TOKEN_ID, created: 1690000000, lastUsed: 1720000000 }, // created 2023-07-22
  ],
  next_cursor: ``,
  prev_cursor: ``,
  total_count: 2,
  current_token_id: CURRENT_TOKEN_ID,
};
