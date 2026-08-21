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
