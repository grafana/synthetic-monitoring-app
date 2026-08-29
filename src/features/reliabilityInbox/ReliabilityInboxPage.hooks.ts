import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAssistant } from '@grafana/assistant';
import { trackRecommendationReviewed, trackSetupWithAssistant } from 'features/tracking/reliabilityInboxEvents';

import { getUserPermissions } from 'data/permissions';

import { useReliabilityInboxDismissals, useReliabilityInboxSuggestions } from './data';
import {
  getAssistantActionState,
  getAssistantOpenPayload,
  getManualCreateLocation,
} from './ReliabilityInboxPage.utils';

export function useReliabilityInboxReview(suggestionsQuery: ReturnType<typeof useReliabilityInboxSuggestions>) {
  const navigate = useNavigate();
  const { canWriteChecks } = getUserPermissions();
  const { isAvailable: isAssistantAvailable, isLoading: isAssistantLoading, openAssistant } = useAssistant();
  const { data, error, isLoading, isFetching, isError, refetch } = suggestionsQuery;
  const { dismissedSuggestionIds, dismissSuggestion, restoreSuggestion } = useReliabilityInboxDismissals();
  const [queueView, setQueueView] = useState<'active' | 'dismissed'>('active');
  const allOpportunities = data ?? [];
  const activeOpportunities = allOpportunities.filter(({ id }) => !dismissedSuggestionIds.includes(id));
  const dismissedOpportunities = allOpportunities.filter(({ id }) => dismissedSuggestionIds.includes(id));
  const opportunities = queueView === 'active' ? activeOpportunities : dismissedOpportunities;
  const [selectedId, setSelectedId] = useState<string>();
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
  };

  const restoreSelected = () => {
    if (!selected) {
      return;
    }

    restoreSuggestion(selected.id);
  };

  const setUpWithAssistant = () => {
    if (!openAssistant || !selected) {
      return;
    }

    trackSetupWithAssistant({ opportunityId: selected.id });
    openAssistant(getAssistantOpenPayload(selected));
  };

  const createManually = () => {
    if (!selected) {
      return;
    }

    // Use React Router navigate so location.state reaches NewCheckV2. locationService.push drops it.
    const { pathname, search, state } = getManualCreateLocation(selected);
    navigate({ pathname, search }, { state });
  };

  return {
    opportunities,
    activeOpportunities,
    dismissedOpportunities,
    queueView,
    selected,
    isLoading,
    isFetching,
    isError,
    error,
    data,
    assistantAction,
    refetch,
    selectOpportunity: setSelectedId,
    setQueueView,
    dismissSelected,
    restoreSelected,
    createManually,
    setUpWithAssistant,
  };
}
