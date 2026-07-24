import { useQuery } from '@tanstack/react-query';
import { getBackendSrv } from '@grafana/runtime';
import { firstValueFrom } from 'rxjs';

import { reliabilitySuggestionsSchema } from './types';

import { toReliabilityOpportunity } from './model';

export const RELIABILITY_INBOX_SUGGESTIONS_URL =
  '/api/plugins/grafana-synthetic-monitoring-app/resources/reliability-inbox/suggestions';

export function useReliabilityInboxSuggestions() {
  return useQuery({
    queryKey: ['reliability-inbox', 'suggestions'],
    queryFn: async () => {
      const response = await firstValueFrom(
        getBackendSrv().fetch<unknown>({
          method: 'GET',
          url: RELIABILITY_INBOX_SUGGESTIONS_URL,
          showErrorAlert: false,
        })
      );

      return reliabilitySuggestionsSchema.parse(response.data).suggestions.map(toReliabilityOpportunity);
    },
    retry: false,
    staleTime: Infinity,
  });
}
