import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAssistant } from '@grafana/assistant';
import {
  trackCreateManually,
  trackNamespaceFilterChanged,
  trackRecommendationReviewed,
  trackSetupWithAssistant,
} from 'features/tracking/reliabilityInboxEvents';

import { getUserPermissions } from 'data/permissions';

import { useReliabilityInboxDismissals, useReliabilityInboxSuggestions } from './data';
import { getNamespaceOptions } from './model';
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
  const [namespaceFilter, setNamespaceFilter] = useState<string>();
  const allOpportunities = data ?? [];
  const namespaceOptions = getNamespaceOptions(allOpportunities);

  // Narrowing happens here, over the suggestions already in hand — the
  // endpoint accepts ?namespace= but using it would regenerate, and
  // generation invokes a paid service (see data.ts).
  //
  // A filter naming a namespace the current data no longer contains is
  // ignored rather than stored back: derived this way it self-corrects on
  // refetch, with no effect to keep in sync.
  const activeFilter = namespaceFilter && namespaceOptions.includes(namespaceFilter) ? namespaceFilter : undefined;

  // Tracked here rather than at the call site so no caller can change the
  // filter without it being recorded, and because this is where the option
  // count lives.
  const selectNamespace = (namespace?: string) => {
    if (namespace === activeFilter) {
      return;
    }

    trackNamespaceFilterChanged({ namespaceCount: namespaceOptions.length, cleared: !namespace });
    setNamespaceFilter(namespace);
  };

  const visibleOpportunities = activeFilter
    ? allOpportunities.filter(({ namespace }) => namespace === activeFilter)
    : allOpportunities;

  const activeOpportunities = visibleOpportunities.filter(({ id }) => !dismissedSuggestionIds.includes(id));
  const dismissedOpportunities = visibleOpportunities.filter(({ id }) => dismissedSuggestionIds.includes(id));
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

    trackCreateManually({ opportunityId: selected.id });

    // Use React Router navigate so location.state reaches NewCheckV2. locationService.push drops it.
    const { pathname, search, state } = getManualCreateLocation(selected);
    navigate({ pathname, search }, { state });
  };

  return {
    opportunities,
    activeOpportunities,
    dismissedOpportunities,
    // Unfiltered, so the page can tell "this tenant has no gaps" from "no
    // gaps in the namespace you picked" — the second must keep the filter on
    // screen or the user cannot get back.
    hasOpportunities: allOpportunities.length > 0,
    namespaceOptions,
    namespaceFilter: activeFilter,
    selectNamespace,
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
