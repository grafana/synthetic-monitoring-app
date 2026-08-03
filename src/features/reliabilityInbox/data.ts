import { useQuery } from '@tanstack/react-query';

import { reliabilitySuggestionsSchema } from './types';
import { useSMDS } from 'hooks/useSMDS';

import { isInitialReviewCandidate, toReliabilityOpportunity } from './model';

/**
 * Fetches suggestions from the reliability-inbox experiment.
 */
export function useReliabilityInboxSuggestions() {
  const smDS = useSMDS();
  const apiHost = smDS.instanceSettings.jsonData.apiHost;

  return useQuery({
    // apiHost is in the key because it selects the region, and therefore which
    // instance answered.
    queryKey: ['reliability-inbox', 'suggestions', apiHost],
    enabled: smDS.supportsReliabilityInbox(),
    queryFn: async () => {
      const result = await smDS.getReliabilityInboxSuggestions();

      return reliabilitySuggestionsSchema
        .parse(result)
        .suggestions.filter(isInitialReviewCandidate)
        .map(toReliabilityOpportunity);
    },
    retry: false,
    staleTime: Infinity,
  });
}
