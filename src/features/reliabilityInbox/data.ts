import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { reliabilitySuggestionSchema, reliabilitySuggestionsSchema } from './types';
import { useSMDS } from 'hooks/useSMDS';

import { compareReliabilityOpportunities, isInitialReviewCandidate, toReliabilityOpportunity } from './model';

const STALE_TIME = 6 * 60 * 60 * 1000;

const reliabilityInboxSnapshotSchema = z.object({
  savedAt: z.number(),
  suggestions: z.array(reliabilitySuggestionSchema),
});

export const reliabilityInboxQueryKey = (apiHost: string, stackId: number) =>
  ['reliability-inbox', 'suggestions', apiHost, stackId] as const;

export const reliabilityInboxStorageKey = (apiHost: string, stackId: number) =>
  `synthetic-monitoring:reliability-inbox:v1:${apiHost}:${stackId}`;

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
  const stackId = smDS.instanceSettings.jsonData.metrics.hostedId;
  const storageKey = reliabilityInboxStorageKey(apiHost, stackId);
  const snapshot = readSnapshot(storageKey);

  return useQuery({
    // apiHost is in the key because it selects the region, and therefore which
    // instance answered.
    queryKey: reliabilityInboxQueryKey(apiHost, stackId),
    enabled: generateSuggestions && smDS.supportsReliabilityInbox(),
    initialData: snapshot ? toOpportunities(snapshot.suggestions) : undefined,
    initialDataUpdatedAt: snapshot?.savedAt,
    queryFn: async () => {
      const result = reliabilitySuggestionsSchema.parse(await smDS.getReliabilityInboxSuggestions());

      // The experiment reports degraded failures as HTTP 200 with warnings.
      // Keep the last useful inbox instead of replacing it with that empty response.
      if (result.suggestions.length === 0 && result.warnings.length > 0) {
        throw new Error(result.warnings.join('; '));
      }

      writeSnapshot(storageKey, result.suggestions);

      return toOpportunities(result.suggestions);
    },
    retry: false,
    staleTime: STALE_TIME,
    // Suggestion generation creates a token and invokes a paid service. Retain
    // the result for the lifetime of the SPA session, even when no component is
    // temporarily subscribed, so navigation cannot cause accidental regeneration.
    gcTime: Infinity,
  });
}

function toOpportunities(suggestions: Array<z.infer<typeof reliabilitySuggestionSchema>>) {
  return suggestions.filter(isInitialReviewCandidate).map(toReliabilityOpportunity).sort(compareReliabilityOpportunities);
}

function readSnapshot(key: string) {
  try {
    const value = window.localStorage.getItem(key);
    return value ? reliabilityInboxSnapshotSchema.parse(JSON.parse(value)) : undefined;
  } catch {
    return undefined;
  }
}

function writeSnapshot(key: string, suggestions: Array<z.infer<typeof reliabilitySuggestionSchema>>) {
  try {
    window.localStorage.setItem(key, JSON.stringify({ savedAt: Date.now(), suggestions }));
  } catch {
    // Browser storage is an optimization; generation still works without it.
  }
}
