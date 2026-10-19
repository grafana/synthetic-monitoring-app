import { useCallback } from 'react';
import { trackRecommendationActionCompleted } from 'features/tracking/recommendationEvents';

import { DismissedChecks, Recommendation, RecommendationId } from './Recommendations.types';
import { Check } from 'types';
import { useTenantCostAttributionLabels } from 'data/useTenantCostAttributionLabels';
import { useURLSearchParams } from 'hooks/useURLSearchParams';
import { getMissingCalNames } from 'page/CheckList/CheckList.utils';

import { countDistinctChecks } from './Recommendations.categories';
import { getRecommendationSource } from './Recommendations.links';

export interface FindingSnapshot {
  affectedCheckCount: number;
  alertingGapsCount: number;
  missingCostLabelsCount: number;
  pausedChecksCount: number;
  duplicateChecksCount: number;
  overlappingTargetsCount: number;
}

/**
 * How many checks each finding covers right now, before any dismissal. Comparing a tenant's
 * first snapshot with its latest is how a dashboard tells whether problems got fixed. Counted
 * before dismissals on purpose: those are stored per browser, so subtracting them would make a
 * tenant look healthier without anything having changed.
 */
export function getFindingSnapshot(recommendations: Recommendation[]): FindingSnapshot {
  const countFor = (id: RecommendationId) => recommendations.find((finding) => finding.id === id)?.checks.length ?? 0;

  return {
    affectedCheckCount: countDistinctChecks(recommendations),
    alertingGapsCount: countFor(RecommendationId.AlertingGaps),
    missingCostLabelsCount: countFor(RecommendationId.MissingCostLabels),
    pausedChecksCount: countFor(RecommendationId.PausedChecks),
    duplicateChecksCount: countFor(RecommendationId.DuplicateChecks),
    overlappingTargetsCount: countFor(RecommendationId.OverlappingTargets),
  };
}

/** Checks the user has dismissed that still belong to a current finding; stale dismissals are not counted. */
export function countDismissedChecks(recommendations: Recommendation[], dismissed: DismissedChecks): number {
  return recommendations.reduce((total, { id, checks }) => {
    const dismissedIds = new Set(dismissed[id] ?? []);

    return total + checks.filter((check) => dismissedIds.has(check.id!)).length;
  }, 0);
}

/**
 * For the check editor, where cost attribution labels are added: reports a save that leaves the
 * check missing none, when the cost-labels finding's link opened the editor. A partial fill does
 * not count, since the check is still in the finding.
 */
export function useTrackCostLabelsAdded(check?: Check) {
  const finding = getRecommendationSource(useURLSearchParams());
  const { data } = useTenantCostAttributionLabels();

  return useCallback(
    (saved: Check) => {
      if (finding !== RecommendationId.MissingCostLabels || !check) {
        return;
      }

      const calNames = data?.names ?? [];
      const wasMissing = getMissingCalNames(check.labels, calNames).length > 0;

      if (wasMissing && getMissingCalNames(saved.labels, calNames).length === 0) {
        trackRecommendationActionCompleted({ finding, action: 'labels_added', checkCount: 1, scope: 'check' });
      }
    },
    [finding, check, data?.names]
  );
}
