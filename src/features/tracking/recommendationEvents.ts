import { createSMEventFactory, TrackingEventProps } from 'features/tracking/utils';

const recommendationEvents = createSMEventFactory('recommendations');

interface TabViewed extends TrackingEventProps {
  /** How many findings the tab had for this tenant, so an empty tab is distinguishable from an unread one. */
  findingCount: number;
  /** How many of those findings the user had dismissed, so a quiet tab is distinguishable from a muted one. */
  dismissedCount: number;
  /** How many checks the tenant has, to read the findings against the size of the fleet. */
  checkCount: number;
  /** The `RecommendationId` a deep link pointed at, when the visit came from one. */
  focusSource?: string;
}

/** Tracks a visit to the Recommendations tab, whether or not it found anything. */
export const trackRecommendationsTabViewed = recommendationEvents<TabViewed>('tab_viewed');

interface FindingShown extends TrackingEventProps {
  /** The `RecommendationId` of the finding. */
  finding: string;
  /** How many checks the finding covers. */
  affectedCheckCount: number;
}

/** Tracks each finding rendered on the tab, so impressions can be compared against clicks. */
export const trackRecommendationShown = recommendationEvents<FindingShown>('finding_shown');

interface FindingActioned extends TrackingEventProps {
  /** The `RecommendationId` of the finding. */
  finding: string;
  /** Whether the click was on the whole finding, a group within it, or a single check. */
  scope: 'finding' | 'group' | 'check';
}

/** Tracks a click through from a finding into the check list or a check's editor. */
export const trackRecommendationActioned = recommendationEvents<FindingActioned>('finding_actioned');

interface ActionCompleted extends TrackingEventProps {
  /** The `RecommendationId` of the finding. */
  finding: string;
  /** What was changed on the user's behalf. */
  action: 'alerts_added' | 'check_resumed';
  /** How many checks the change reached. */
  checkCount: number;
  /** Whether the action ran for the whole finding or a single check. */
  scope: 'finding' | 'check';
}

/**
 * Tracks an action carried out from the tab itself, as opposed to a click that leads somewhere.
 * Alongside impressions and clicks, this is what shows whether a finding gets acted on.
 */
export const trackRecommendationActionCompleted = recommendationEvents<ActionCompleted>('action_completed');

interface FindingDismissed extends TrackingEventProps {
  /** The `RecommendationId` of the finding. */
  finding: string;
  /** Whether the whole finding was hidden or one check within it. */
  scope: 'finding' | 'check';
}

/**
 * Tracks a finding, or a single check within one, being hidden from the tab. A dismissal says
 * the user saw the recommendation and judged it not worth acting on.
 */
export const trackRecommendationDismissed = recommendationEvents<FindingDismissed>('finding_dismissed');

/** Tracks dismissed findings or checks being brought back. */
export const trackRecommendationRestored = recommendationEvents<FindingDismissed>('finding_restored');
