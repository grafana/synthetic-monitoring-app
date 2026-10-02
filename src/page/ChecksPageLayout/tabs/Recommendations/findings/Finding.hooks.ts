import { useMemo } from 'react';

import { FindingProps } from './Finding.types';

import { getFindingSeverity } from '../Recommendations.categories';
import { getRecommendationCopy, getRecommendationSummary } from '../Recommendations.copy';
import { useDismissedChecks } from '../Recommendations.hooks';

export function useFindingPanel(
  { recommendation, totalCheckCount, isSolo }: Pick<FindingProps, 'recommendation' | 'totalCheckCount' | 'isSolo'>,
  calNames: string[] = []
) {
  const { id, checks } = recommendation;
  const { title, tooltip } = getRecommendationCopy(id, calNames);
  const severity = getFindingSeverity(id);
  const summary = getRecommendationSummary(recommendation, totalCheckCount);
  const { dismissedIds, dismissCheck, restoreChecks } = useDismissedChecks(id);

  const rows = useMemo(() => checks.filter((check) => !dismissedIds.includes(check.id!)), [checks, dismissedIds]);
  // A stale dismissal of a check since fixed is nothing to restore.
  const dismissedCount = checks.length - rows.length;

  return {
    severity,
    // Solo: the category name is already the pane heading, so the summary becomes the title.
    header: isSolo ? { title: summary } : { title, summary, tooltip },
    rows,
    dismissedCount,
    dismissCheck,
    restoreChecks,
  };
}
