import { useCallback, useEffect, useMemo, useRef } from 'react';
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
  const dismissed = useMemo(() => stored.filter((id) => Object.values(RecommendationId).includes(id)), [stored]);

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
}

/**
 * Engagement is what decides which findings survive past this experiment, so impressions are
 * reported alongside clicks. Both are reported once per visit rather than on every re-render,
 * and only for findings the user can actually see.
 */
export function useRecommendationImpressions(
  visible: Recommendation[],
  { checkCount, dismissedCount }: ImpressionContext
) {
  const reported = useRef(false);

  useEffect(() => {
    if (reported.current) {
      return;
    }

    reported.current = true;
    trackRecommendationsTabViewed({ findingCount: visible.length + dismissedCount, dismissedCount, checkCount });
    visible.forEach(({ id, checks }) => trackRecommendationShown({ finding: id, affectedCheckCount: checks.length }));
  }, [visible, checkCount, dismissedCount]);
}
