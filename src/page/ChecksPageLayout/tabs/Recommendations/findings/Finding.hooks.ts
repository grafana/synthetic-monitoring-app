import { useMemo } from 'react';

import { FindingProps } from './Finding.types';

import { getRecommendationCopy, getRecommendationSummary } from '../Recommendations.copy';
import { useDismissedChecks } from '../Recommendations.hooks';

/**
 * What every finding panel needs from its props: the header copy in its solo or sibling form,
 * the severity, and the rows left after per-check dismissals.
 */
export function useFindingPanel(
  { recommendation, totalCheckCount, isSolo }: Pick<FindingProps, 'recommendation' | 'totalCheckCount' | 'isSolo'>,
  calNames: string[] = []
) {
  const { id, checks } = recommendation;
  const { severity, title, tooltip } = getRecommendationCopy(id, calNames);
  const summary = getRecommendationSummary(recommendation, totalCheckCount);
  const { dismissedIds, dismissCheck, restoreChecks } = useDismissedChecks(id);

  const rows = useMemo(() => checks.filter((check) => !dismissedIds.includes(check.id!)), [checks, dismissedIds]);
  // Only checks still in the finding count; a stale dismissal of a check since fixed is not something to restore.
  const dismissedCount = checks.length - rows.length;

  return {
    severity,
    // A solo panel's title is its summary, since the category name is already the pane heading.
    header: isSolo ? { title: summary } : { title, summary, tooltip },
    rows,
    dismissedCount,
    dismissCheck,
    restoreChecks,
  };
}
