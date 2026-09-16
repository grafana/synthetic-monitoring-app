import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router';
import { locationService } from '@grafana/runtime';
import {
  trackRecommendationDismissed,
  trackRecommendationRestored,
  trackRecommendationShown,
  trackRecommendationsTabViewed,
} from 'features/tracking/recommendationEvents';
import { useLocalStorage } from 'usehooks-ts';

import { Recommendation, RecommendationCategoryId, RecommendationId } from './Recommendations.types';
import { Check } from 'types';
import { useURLSearchParams } from 'hooks/useURLSearchParams';

import { getCategoryForFinding, isCategoryId } from './Recommendations.categories';
import {
  CATEGORY_PARAM,
  DISMISSED_CHECKS_STORAGE_KEY,
  DISMISSED_FINDINGS_STORAGE_KEY,
  FOCUS_PARAM,
} from './Recommendations.constants';

/**
 * Findings the user has hidden. M1 keeps no server-side state, so this lives in the browser
 * like the other dismissible prompts in the app; the point of recording it at all is the
 * dismissal signal, which says a finding was seen and judged not worth acting on.
 */
export function useDismissedRecommendations() {
  const [stored, setStored] = useLocalStorage<RecommendationId[]>(DISMISSED_FINDINGS_STORAGE_KEY, []);
  // Guard against a hand-edited or stale value: only known ids count.
  const dismissed = useMemo(() => stored.filter(isRecommendationId), [stored]);

  const dismiss = useCallback(
    (id: RecommendationId) => {
      setStored((current) => (current.includes(id) ? current : [...current, id]));
      trackRecommendationDismissed({ finding: id, scope: 'finding' });
    },
    [setStored]
  );

  const restoreAll = useCallback(() => {
    dismissed.forEach((id) => trackRecommendationRestored({ finding: id, scope: 'finding' }));
    setStored([]);
  }, [dismissed, setStored]);

  return { dismissed, dismiss, restoreAll };
}

type DismissedChecks = Partial<Record<RecommendationId, number[]>>;

/**
 * Individual rows the user has hidden within a finding, keyed by finding then check id, so
 * "not this one" can be said without dismissing the whole finding. Kept separately from finding
 * dismissals so either can be restored on its own.
 */
export function useDismissedChecks(finding: RecommendationId) {
  const [stored, setStored] = useLocalStorage<DismissedChecks>(DISMISSED_CHECKS_STORAGE_KEY, {});
  const dismissedIds = useMemo(() => stored[finding] ?? [], [stored, finding]);

  const dismissCheck = useCallback(
    (check: Check) => {
      setStored((current) => {
        const ids = current[finding] ?? [];

        return ids.includes(check.id!) ? current : { ...current, [finding]: [...ids, check.id!] };
      });
      trackRecommendationDismissed({ finding, scope: 'check' });
    },
    [finding, setStored]
  );

  const restoreChecks = useCallback(() => {
    setStored(({ [finding]: _removed, ...rest }) => rest);
    trackRecommendationRestored({ finding, scope: 'check' });
  }, [finding, setStored]);

  return { dismissedIds, dismissCheck, restoreChecks };
}

/**
 * Which rows of a finding are ticked. Selection is per finding and per visit: it is a means to
 * a bulk action, not something to remember.
 */
export function useRowSelection(checks: Check[]) {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Rows can leave the list (acted on, dismissed, refetched); a selection must not outlive its row.
  const selected = useMemo(() => checks.filter((check) => selectedIds.includes(check.id!)), [checks, selectedIds]);

  const toggle = useCallback((check: Check) => {
    setSelectedIds((current) =>
      current.includes(check.id!) ? current.filter((id) => id !== check.id) : [...current, check.id!]
    );
  }, []);

  const clear = useCallback(() => setSelectedIds([]), []);

  const isSelected = useCallback((check: Check) => selectedIds.includes(check.id!), [selectedIds]);

  return { selected, isSelected, toggle, clear };
}

interface ImpressionContext {
  checkCount: number;
  dismissedCount: number;
  focusedId?: RecommendationId;
}

/**
 * Engagement is what decides which findings survive past this experiment, so impressions are
 * reported alongside clicks. Both are reported once per visit rather than on every re-render,
 * and only for findings the user can actually see.
 */
export function useRecommendationImpressions(
  visible: Recommendation[],
  { checkCount, dismissedCount, focusedId }: ImpressionContext
) {
  const reported = useRef(false);

  useEffect(() => {
    if (reported.current) {
      return;
    }

    reported.current = true;
    trackRecommendationsTabViewed({
      findingCount: visible.length + dismissedCount,
      dismissedCount,
      checkCount,
      focusSource: focusedId,
    });
    visible.forEach(({ id, checks }) => trackRecommendationShown({ finding: id, affectedCheckCount: checks.length }));
  }, [visible, checkCount, dismissedCount, focusedId]);
}

/** The landing view: one row per category, no findings rendered. */
export const ATTENTION_VIEW = 'attention';

export type RecommendationsView = typeof ATTENTION_VIEW | RecommendationCategoryId;

/**
 * Which view the tab shows, held in the URL so it survives a reload and can be linked to.
 * `?finding=<RecommendationId>` (a deep link from a banner or the Reliability Inbox) wins over
 * `?category=`: it selects the category holding that finding and marks the finding focused.
 * Anything unrecognised falls back to the landing view.
 */
export function useRecommendationsView() {
  const { pathname, search } = useLocation();
  const params = useURLSearchParams();
  const focusParam = params.get(FOCUS_PARAM);
  const categoryParam = params.get(CATEGORY_PARAM);
  const focusedId = isRecommendationId(focusParam) ? focusParam : undefined;

  const view: RecommendationsView = focusedId
    ? getCategoryForFinding(focusedId).id
    : isCategoryId(categoryParam)
      ? categoryParam
      : ATTENTION_VIEW;

  const setView = useCallback(
    (next: RecommendationsView) => {
      const nextParams = new URLSearchParams(search);
      // Moving on from a deep link ends the focus; otherwise the finding would keep pulling
      // the view back to its category.
      nextParams.delete(FOCUS_PARAM);

      if (next === ATTENTION_VIEW) {
        nextParams.delete(CATEGORY_PARAM);
      } else {
        nextParams.set(CATEGORY_PARAM, next);
      }

      const nextSearch = nextParams.toString();
      locationService.replace(nextSearch ? `${pathname}?${nextSearch}` : pathname);
    },
    [pathname, search]
  );

  return { view, setView, focusedId };
}

function isRecommendationId(value: string | null | undefined): value is RecommendationId {
  return value != null && Object.values(RecommendationId).includes(value as RecommendationId);
}
