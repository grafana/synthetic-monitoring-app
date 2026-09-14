import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useLocation } from 'react-router';
import {
  trackRecommendationDismissed,
  trackRecommendationRestored,
  trackRecommendationShown,
  trackRecommendationsTabViewed,
} from 'features/tracking/recommendationEvents';
import { useLocalStorage } from 'usehooks-ts';

import { Recommendation, RecommendationId } from './Recommendations.types';

import { DISMISSED_FINDINGS_STORAGE_KEY } from './Recommendations.constants';

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
      trackRecommendationDismissed({ finding: id });
    },
    [setStored]
  );

  const restoreAll = useCallback(() => {
    dismissed.forEach((id) => trackRecommendationRestored({ finding: id }));
    setStored([]);
  }, [dismissed, setStored]);

  return { dismissed, dismiss, restoreAll };
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

const FOCUS_PARAM = 'finding';

/**
 * The finding a deep link (`?finding=<RecommendationId>`) points at, so a banner or the
 * Reliability Inbox can land someone on one panel rather than the top of the tab. Unknown
 * values are ignored.
 */
export function useFocusedRecommendation(): RecommendationId | undefined {
  const { search } = useLocation();
  const value = new URLSearchParams(search).get(FOCUS_PARAM);

  return isRecommendationId(value) ? value : undefined;
}

function isRecommendationId(value: string | null): value is RecommendationId {
  return value !== null && Object.values(RecommendationId).includes(value as RecommendationId);
}
