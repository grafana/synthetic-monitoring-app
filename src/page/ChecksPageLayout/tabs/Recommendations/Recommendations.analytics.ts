import { useEffect } from 'react';
import { trackRecommendationsTabExposed } from 'features/tracking/recommendationEvents';

import { DismissedChecks, Recommendation, RecommendationId } from './Recommendations.types';

import { countDistinctChecks } from './Recommendations.categories';
import { EXPOSED_STORAGE_KEY } from './Recommendations.constants';

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
 * The denominator for adoption: sessions that could have opened the tab. Reported from the Checks
 * page, which shows the tab whichever of its tabs is open.
 */
export function useTrackRecommendationsExposure(isEnabled: boolean) {
  useEffect(() => {
    if (!isEnabled || window.sessionStorage.getItem(EXPOSED_STORAGE_KEY)) {
      return;
    }

    window.sessionStorage.setItem(EXPOSED_STORAGE_KEY, 'true');
    trackRecommendationsTabExposed();
  }, [isEnabled]);
}
