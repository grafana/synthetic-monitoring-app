import { useMemo } from 'react';
import { t } from '@grafana/i18n';

import { FindingProps } from './Finding.types';

import { getFindingSeverity } from '../Recommendations.categories';
import { getFilteredSummary, getRecommendationCopy, getRecommendationSummary } from '../Recommendations.copy';
import { useDismissedChecks } from '../Recommendations.hooks';

export function useFindingPanel(
  {
    recommendation,
    totalCheckCount,
    isSolo,
    filter,
  }: Pick<FindingProps, 'recommendation' | 'totalCheckCount' | 'isSolo' | 'filter'>,
  calNames: string[] = []
) {
  const { id, checks } = recommendation;
  const { title, tooltip } = getRecommendationCopy(id, calNames);
  const severity = getFindingSeverity(id);
  const { dismissedIds, dismissCheck, dismissChecks, restoreChecks } = useDismissedChecks(id);

  const unfilteredRows = useMemo(
    () => checks.filter((check) => !dismissedIds.includes(check.id!)),
    [checks, dismissedIds]
  );
  const rows = useMemo(
    () => (filter.isActive ? unfilteredRows.filter(filter.matches) : unfilteredRows),
    [filter, unfilteredRows]
  );
  // A stale dismissal of a check since fixed is nothing to restore.
  const dismissedCount = checks.length - unfilteredRows.length;
  // Rows the user dismissed are not the filters' doing, so with none left the panel reads as unfiltered.
  const isNarrowed = filter.isActive && unfilteredRows.length > 0;
  const summary = isNarrowed
    ? getFilteredSummary(rows.length, unfilteredRows.length)
    : getRecommendationSummary(recommendation, totalCheckCount);
  const emptyMessage =
    isNarrowed && rows.length === 0
      ? t('recommendations.filters.emptyFinding', 'No checks in this finding match your filters.')
      : undefined;

  return {
    severity,
    // Solo: the category name is already the pane heading, so the summary becomes the title.
    header: isSolo ? { title: summary, emptyMessage } : { title, summary, tooltip, emptyMessage },
    rows,
    unfilteredRows,
    dismissedCount,
    dismissCheck,
    dismissChecks,
    restoreChecks,
  };
}
