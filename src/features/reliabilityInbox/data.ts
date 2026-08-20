import { useQuery } from '@tanstack/react-query';
import { DataFrame, DataSourceInstanceSettings } from '@grafana/data';
import { queryDS } from 'features/queryDatasources/queryDS';
import { useLocalStorage } from 'usehooks-ts';
import { z } from 'zod';

import { ReliabilityEvidence, reliabilitySuggestionSchema, reliabilitySuggestionsSchema } from './types';
import { useSMDS } from 'hooks/useSMDS';

import { getRecommendationTelemetryProvenance } from './evidence';
import { compareReliabilityOpportunities, isInitialReviewCandidate, toReliabilityOpportunity } from './model';

const STALE_TIME = 6 * 60 * 60 * 1000;

const reliabilityInboxSnapshotSchema = z.object({
  savedAt: z.number(),
  suggestions: z.array(reliabilitySuggestionSchema),
});
const dismissedSuggestionIdsSchema = z.array(z.string());
const dismissedSuggestionIdsStorageOptions = {
  deserializer: (value: string) => dismissedSuggestionIdsSchema.parse(JSON.parse(value)),
};

export const reliabilityInboxQueryKey = (apiHost: string, stackId: number) =>
  ['reliability-inbox', 'suggestions', apiHost, stackId] as const;

export const reliabilityInboxStorageKey = (apiHost: string, stackId: number) =>
  `synthetic-monitoring:reliability-inbox:v1:${apiHost}:${stackId}`;

export const reliabilityInboxDismissalsKey = (apiHost: string, stackId: number) =>
  `synthetic-monitoring:reliability-inbox-dismissals:v1:${apiHost}:${stackId}`;

/**
 * Fetches suggestions from the reliability-inbox experiment.
 */
export function useReliabilityInboxSuggestions({ includeDismissed = false } = {}) {
  return useReliabilityInboxQuery(true, includeDismissed);
}

/**
 * Subscribes to generated suggestions already held by React Query without
 * triggering the paid generation request. The homepage banner uses this hook.
 */
export function useCachedReliabilityInboxSuggestions() {
  return useReliabilityInboxQuery(false, false);
}

export function useReliabilityInboxDismissals() {
  const smDS = useSMDS();
  return useScopedReliabilityInboxDismissals(
    smDS.instanceSettings.jsonData.apiHost,
    smDS.instanceSettings.jsonData.metrics.hostedId
  );
}

export function useRecommendationTelemetry(evidence: ReliabilityEvidence, enabled: boolean) {
  const provenance = getRecommendationTelemetryProvenance(evidence);
  const metricsDatasource = useSMDS().getMetricsDS();

  return useQuery<DataFrame[]>({
    queryKey: ['reliability-inbox', 'recommendation-telemetry', metricsDatasource, evidence, provenance],
    enabled: enabled && Boolean(provenance) && Boolean(metricsDatasource),
    queryFn: () => (metricsDatasource ? queryRecommendationTelemetry(evidence, metricsDatasource) : []),
    retry: false,
    staleTime: Infinity,
  });
}

export async function queryRecommendationTelemetry(
  evidence: ReliabilityEvidence,
  metricsDatasource: DataSourceInstanceSettings,
  executeQuery: typeof queryDS = queryDS
) {
  const provenance = getRecommendationTelemetryProvenance(evidence);

  if (!provenance) {
    return [];
  }

  const result = await executeQuery({
    start: provenance.from,
    end: provenance.to,
    queries: provenance.queries.map((query) => ({
      ...query,
      datasource: { uid: metricsDatasource.uid, type: metricsDatasource.type },
      interval: '1m',
      intervalMs: 60_000,
      maxDataPoints: 120,
    })),
  });

  return provenance.queries.flatMap(({ refId }) => result[refId] ?? []);
}

function useReliabilityInboxQuery(generateSuggestions: boolean, includeDismissed: boolean) {
  const smDS = useSMDS();
  const apiHost = smDS.instanceSettings.jsonData.apiHost;
  const stackId = smDS.instanceSettings.jsonData.metrics.hostedId;
  const storageKey = reliabilityInboxStorageKey(apiHost, stackId);
  const snapshot = readSnapshot(storageKey);
  const { dismissedSuggestionIds } = useScopedReliabilityInboxDismissals(apiHost, stackId);

  return useQuery({
    // apiHost is in the key because it selects the region, and therefore which
    // instance answered.
    queryKey: reliabilityInboxQueryKey(apiHost, stackId),
    enabled: generateSuggestions && smDS.supportsReliabilityInbox(),
    initialData: snapshot ? toOpportunities(snapshot.suggestions) : undefined,
    initialDataUpdatedAt: snapshot?.savedAt,
    queryFn: async () => {
      const suggestions = await smDS.getReliabilityInboxSuggestions();
      const result = reliabilitySuggestionsSchema.parse(suggestions);

      // The experiment reports degraded failures as HTTP 200 with warnings.
      // Keep the last useful inbox instead of replacing it with that empty response.
      if (result.suggestions.length === 0 && result.warnings.length > 0) {
        throw new Error(result.warnings.join('; '));
      }

      writeSnapshot(reliabilityInboxStorageKey(apiHost, stackId), result.suggestions);

      return toOpportunities(result.suggestions);
    },
    retry: false,
    staleTime: STALE_TIME,
    // Suggestion generation creates a token and invokes a paid service. Retain
    // the result for the lifetime of the SPA session, even when no component is
    // temporarily subscribed, so navigation cannot cause accidental regeneration.
    gcTime: Infinity,
    select: (opportunities) =>
      includeDismissed ? opportunities : opportunities.filter(({ id }) => !dismissedSuggestionIds.includes(id)),
  });
}

function useScopedReliabilityInboxDismissals(apiHost: string, stackId: number) {
  const [dismissedSuggestionIds, setDismissedSuggestionIds] = useLocalStorage<string[]>(
    reliabilityInboxDismissalsKey(apiHost, stackId),
    [],
    dismissedSuggestionIdsStorageOptions
  );
  return {
    dismissedSuggestionIds,
    dismissSuggestion: (id: string) =>
      setDismissedSuggestionIds((dismissedIds) => (dismissedIds.includes(id) ? dismissedIds : [...dismissedIds, id])),
    restoreSuggestion: (id: string) =>
      setDismissedSuggestionIds((dismissedIds) => dismissedIds.filter((dismissedId) => dismissedId !== id)),
  };
}

function toOpportunities(suggestions: Array<z.infer<typeof reliabilitySuggestionSchema>>) {
  return suggestions
    .filter(isInitialReviewCandidate)
    .map(toReliabilityOpportunity)
    .sort(compareReliabilityOpportunities);
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
