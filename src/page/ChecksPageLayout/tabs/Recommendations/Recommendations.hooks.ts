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

import { DismissedChecks, Recommendation, RecommendationCategoryId, RecommendationId } from './Recommendations.types';
import { Check } from 'types';
import { useURLSearchParams } from 'hooks/useURLSearchParams';

import { getCategoryForFinding, isCategoryId } from './Recommendations.categories';
import {
  CATEGORY_PARAM,
  DISMISSED_CHECKS_STORAGE_KEY,
  DISMISSED_FINDINGS_STORAGE_KEY,
  FOCUS_PARAM,
} from './Recommendations.constants';
import { getDismissedCheckIds } from './Recommendations.utils';

// Browser-local like the app's other dismissible prompts; M1 has no server-side state.
export function useDismissedRecommendations() {
  const [stored, setStored] = useLocalStorage<RecommendationId[]>(DISMISSED_FINDINGS_STORAGE_KEY, []);
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

const NO_DISMISSED_CHECKS: DismissedChecks = {};

// Read by the landing view so its action label counts the same rows the panel will.
export function useDismissedCheckMap(): DismissedChecks {
  const [stored] = useLocalStorage<DismissedChecks>(DISMISSED_CHECKS_STORAGE_KEY, NO_DISMISSED_CHECKS);

  return useMemo(() => (stored && typeof stored === 'object' && !Array.isArray(stored) ? stored : {}), [stored]);
}

// Separate from finding dismissals so either can be restored on its own.
export function useDismissedChecks(finding: RecommendationId) {
  const [stored, setStored] = useLocalStorage<DismissedChecks>(DISMISSED_CHECKS_STORAGE_KEY, NO_DISMISSED_CHECKS);
  const dismissedIds = useMemo(() => getDismissedCheckIds(stored, finding), [stored, finding]);

  const dismissCheck = useCallback(
    (check: Check) => {
      setStored((current) => {
        const ids = getDismissedCheckIds(current, finding);

        return ids.includes(check.id!) ? current : { ...current, [finding]: [...ids, check.id!] };
      });
      trackRecommendationDismissed({ finding, scope: 'check' });
    },
    [finding, setStored]
  );

  const restoreChecks = useCallback(() => {
    setStored(({ [finding]: _removed, ...rest } = {}) => rest);
    trackRecommendationRestored({ finding, scope: 'check' });
  }, [finding, setStored]);

  return { dismissedIds, dismissCheck, restoreChecks };
}

export function useRowSelection(checks: Check[]) {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Rows leave the list when acted on, dismissed or refetched; the selection follows them out.
  const selected = useMemo(() => checks.filter((check) => selectedIds.includes(check.id!)), [checks, selectedIds]);

  const toggle = useCallback((check: Check) => {
    setSelectedIds((current) =>
      current.includes(check.id!) ? current.filter((id) => id !== check.id) : [...current, check.id!]
    );
  }, []);

  const clear = useCallback(() => setSelectedIds([]), []);

  const deselect = useCallback((checks: Check[]) => {
    const ids = checks.map((check) => check.id);
    setSelectedIds((current) => current.filter((id) => !ids.includes(id)));
  }, []);

  const isSelected = useCallback((check: Check) => selectedIds.includes(check.id!), [selectedIds]);

  return { selected, isSelected, toggle, clear, deselect };
}

interface ImpressionContext {
  visible: Recommendation[];
  /** Panels on screen right now: the active category's, or none on the landing view. */
  shown: Recommendation[];
  checkCount: number;
  dismissedCount: number;
  focusedId?: RecommendationId;
}

// A finding counts as shown the first time its panel renders, so an unopened category is not "seen".
export function useRecommendationImpressions({
  visible,
  shown,
  checkCount,
  dismissedCount,
  focusedId,
}: ImpressionContext) {
  const visitReported = useRef(false);
  const shownReported = useRef(new Set<RecommendationId>());

  useEffect(() => {
    if (visitReported.current) {
      return;
    }

    visitReported.current = true;
    trackRecommendationsTabViewed({
      findingCount: visible.length + dismissedCount,
      dismissedCount,
      checkCount,
      focusSource: focusedId,
    });
  }, [visible, checkCount, dismissedCount, focusedId]);

  useEffect(() => {
    shown.forEach(({ id, checks }) => {
      if (!shownReported.current.has(id)) {
        shownReported.current.add(id);
        trackRecommendationShown({ finding: id, affectedCheckCount: checks.length });
      }
    });
  }, [shown]);
}

export const ATTENTION_VIEW = 'attention';

export type RecommendationsView = typeof ATTENTION_VIEW | RecommendationCategoryId;

// `?category=<id>`, or `?finding=<RecommendationId>` which wins and selects the finding's category.
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
      // Otherwise the focused finding keeps pulling the view back to its category.
      nextParams.delete(FOCUS_PARAM);

      if (next === ATTENTION_VIEW) {
        nextParams.delete(CATEGORY_PARAM);
      } else {
        nextParams.set(CATEGORY_PARAM, next);
      }

      // Pushed so Back returns to the landing view rather than leaving the tab.
      const nextSearch = nextParams.toString();
      locationService.push(nextSearch ? `${pathname}?${nextSearch}` : pathname);
    },
    [pathname, search]
  );

  return { view, setView, focusedId };
}

function isRecommendationId(value: string | null | undefined): value is RecommendationId {
  return value != null && Object.values(RecommendationId).includes(value as RecommendationId);
}
