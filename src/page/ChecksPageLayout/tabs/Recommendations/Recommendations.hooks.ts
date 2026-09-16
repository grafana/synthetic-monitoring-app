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

const NO_DISMISSED_CHECKS: DismissedChecks = {};

/**
 * Every per-check dismissal, by finding. The landing view reads this so what it promises for a
 * finding ("Set up alerts for all 2") matches what the finding's own panel will offer.
 */
export function useDismissedCheckMap(): DismissedChecks {
  const [stored] = useLocalStorage<DismissedChecks>(DISMISSED_CHECKS_STORAGE_KEY, NO_DISMISSED_CHECKS);

  // Guard against a hand-edited value: anything that is not an object of arrays reads as empty.
  return useMemo(() => (stored && typeof stored === 'object' && !Array.isArray(stored) ? stored : {}), [stored]);
}

/**
 * Individual rows the user has hidden within a finding, keyed by finding then check id, so
 * "not this one" can be said without dismissing the whole finding. Kept separately from finding
 * dismissals so either can be restored on its own.
 */
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

  /** Untick just these, e.g. the ones an action succeeded on, leaving the rest ticked for a retry. */
  const deselect = useCallback((checks: Check[]) => {
    const ids = checks.map((check) => check.id);
    setSelectedIds((current) => current.filter((id) => !ids.includes(id)));
  }, []);

  const isSelected = useCallback((check: Check) => selectedIds.includes(check.id!), [selectedIds]);

  return { selected, isSelected, toggle, clear, deselect };
}

interface ImpressionContext {
  /** Every finding the tenant has that is not dismissed, whichever view is showing. */
  visible: Recommendation[];
  /** The findings whose panels are on screen right now: the active category's, or none on the landing view. */
  shown: Recommendation[];
  checkCount: number;
  dismissedCount: number;
  focusedId?: RecommendationId;
}

/**
 * Engagement is what decides which findings survive past this experiment, so impressions are
 * reported alongside clicks. The visit is reported once; a finding is reported the first time its
 * panel is actually rendered, so a category the user never opens does not count as seen.
 */
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

      // Pushed, not replaced: Back from a category should return to the landing view, not leave the tab.
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
