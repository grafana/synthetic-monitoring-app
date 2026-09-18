import { SM_DATASOURCE } from 'test/fixtures/datasources';
import { HTTP_RELIABILITY_SUGGESTION } from 'test/fixtures/reliabilityInbox';

import { ApiEntry } from './types';

export const reliabilityInboxSuggestions: ApiEntry = {
  route: `/api/datasources/uid/${SM_DATASOURCE.uid}/resources/reliability-inbox/suggestions`,
  method: 'post',
  result: () => ({
    json: {
      suggestions: [HTTP_RELIABILITY_SUGGESTION],
      warnings: [],
    },
  }),
};

// Defaults to "available" (200) so existing suggestion tests don't each need
// to opt into it; override with apiRoute('reliabilityInboxHealth', { result:
// () => ({ status: 404, json: {} }) }) to test the unavailable case.
export const reliabilityInboxHealth: ApiEntry = {
  route: `/api/datasources/uid/${SM_DATASOURCE.uid}/resources/reliability-inbox/health`,
  method: 'get',
  result: () => ({
    json: { ok: true },
  }),
};
