import { useQuery } from '@tanstack/react-query';

import { reliabilitySuggestionsSchema } from './types';
import { useSMDS } from 'hooks/useSMDS';

import { isInitialReviewCandidate, toReliabilityOpportunity } from './model';

export const reliabilityInboxQueryKey = (apiHost: string) => ['reliability-inbox', 'suggestions', apiHost] as const;

/**
 * Fetches suggestions from the reliability-inbox experiment.
 */
export function useReliabilityInboxSuggestions() {
  return useReliabilityInboxQuery(true);
}

/**
 * Subscribes to generated suggestions already held by React Query without
 * triggering the paid generation request. The homepage banner uses this hook.
 */
export function useCachedReliabilityInboxSuggestions() {
  return useReliabilityInboxQuery(false);
}

function useReliabilityInboxQuery(generateSuggestions: boolean) {
  const smDS = useSMDS();
  const apiHost = smDS.instanceSettings.jsonData.apiHost;

  return useQuery({
    // apiHost is in the key because it selects the region, and therefore which
    // instance answered.
    queryKey: reliabilityInboxQueryKey(apiHost),
    enabled: generateSuggestions && smDS.supportsReliabilityInbox(),
    queryFn: async () => {
      const result = await smDS.getReliabilityInboxSuggestions();

      return reliabilitySuggestionsSchema
        .parse(result)
        .suggestions.filter((suggestion) => isInitialReviewCandidate(suggestion, apiHost))
        .map(toReliabilityOpportunity);
    },
    retry: false,
    staleTime: Infinity,
    // Suggestion generation creates a token and invokes a paid service. Retain
    // the result for the lifetime of the SPA session, even when no component is
    // temporarily subscribed, so navigation cannot cause accidental regeneration.
    gcTime: Infinity,
  });
}
