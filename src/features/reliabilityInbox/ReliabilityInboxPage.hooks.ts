import { useEffect, useRef, useState } from 'react';
import { useAssistant } from '@grafana/assistant';
import { trackRecommendationReviewed, trackSetupWithAssistant } from 'features/tracking/reliabilityInboxEvents';

import { getUserPermissions } from 'data/permissions';

import { useReliabilityInboxDismissals, useReliabilityInboxSuggestions } from './data';
import { getAssistantActionState, getAssistantOpenPayload } from './ReliabilityInboxPage.utils';

export function useReliabilityInboxReview() {
  const { canWriteChecks } = getUserPermissions();
  const { isAvailable: isAssistantAvailable, isLoading: isAssistantLoading, openAssistant } = useAssistant();
  const { data, isLoading, isFetching, isError, refetch } = useReliabilityInboxSuggestions();
  const { dismissSuggestion, restoreSuggestion } = useReliabilityInboxDismissals();
  const opportunities = data ?? [];
  const [selectedId, setSelectedId] = useState<string>();
  const [lastDismissedId, setLastDismissedId] = useState<string>();
  const reviewedIds = useRef(new Set<string>());

  const selected = opportunities.find((opportunity) => opportunity.id === selectedId) ?? opportunities[0];

  useEffect(() => {
    if (!selected || reviewedIds.current.has(selected.id)) {
      return;
    }

    reviewedIds.current.add(selected.id);
    trackRecommendationReviewed({ opportunityId: selected.id });
  }, [selected]);

  const assistantAction = getAssistantActionState({
    canWriteChecks,
    isAssistantLoading,
    isAssistantAvailable,
    hasOpenAssistant: Boolean(openAssistant),
  });

  const dismissSelected = () => {
    if (!selected) {
      return;
    }

    dismissSuggestion(selected.id);
    setLastDismissedId(selected.id);
  };

  const undoDismiss = () => {
    if (!lastDismissedId) {
      return;
    }

    restoreSuggestion(lastDismissedId);
    setSelectedId(lastDismissedId);
    setLastDismissedId(undefined);
  };

  const setUpWithAssistant = () => {
    if (!openAssistant || !selected) {
      return;
    }

    trackSetupWithAssistant({ opportunityId: selected.id });
    openAssistant(getAssistantOpenPayload(selected));
  };

  return {
    opportunities,
    selected,
    isLoading,
    isFetching,
    isError,
    data,
    lastDismissedId,
    assistantAction,
    refetch,
    selectOpportunity: setSelectedId,
    dismissSelected,
    undoDismiss,
    clearDismissalToast: () => setLastDismissedId(undefined),
    setUpWithAssistant,
  };
}
