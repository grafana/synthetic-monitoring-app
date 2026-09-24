import { createSMEventFactory, TrackingEventProps } from 'features/tracking/utils';

const recommendationEvents = createSMEventFactory('recommendations');

interface TabViewed extends TrackingEventProps {
  /** Findings for this tenant, dismissed ones included. */
  findingCount: number;
  /** How many of those the user had dismissed. */
  dismissedCount: number;
  /** How many checks the tenant has. */
  checkCount: number;
  /** The `RecommendationId` a `?finding=` link pointed at, if any. */
  focusSource?: string;
}

/** Tracks a visit to the Recommendations tab. */
export const trackRecommendationsTabViewed = recommendationEvents<TabViewed>('tab_viewed');

interface FindingShown extends TrackingEventProps {
  /** The `RecommendationId` of the finding. */
  finding: string;
  /** How many checks the finding covers. */
  affectedCheckCount: number;
}

/** Tracks the first time a finding's panel is rendered in a visit. */
export const trackRecommendationShown = recommendationEvents<FindingShown>('finding_shown');

interface FindingActioned extends TrackingEventProps {
  /** The `RecommendationId` of the finding. */
  finding: string;
  /** What was clicked: the whole finding, a group within it, or a single check. */
  scope: 'finding' | 'group' | 'check';
}

/** Tracks a click through to the check list or a check's editor. */
export const trackRecommendationActioned = recommendationEvents<FindingActioned>('finding_actioned');

interface ActionCompleted extends TrackingEventProps {
  /** The `RecommendationId` of the finding. */
  finding: string;
  /** What was changed. */
  action: 'alerts_added' | 'check_resumed';
  /** How many checks the change reached. */
  checkCount: number;
  /** Whether it ran for the whole finding, the ticked rows, or a single check. */
  scope: 'finding' | 'selection' | 'check';
}

/** Tracks an action carried out from the tab itself. */
export const trackRecommendationActionCompleted = recommendationEvents<ActionCompleted>('action_completed');

interface FindingDismissed extends TrackingEventProps {
  /** The `RecommendationId` of the finding. */
  finding: string;
  /** Whether the whole finding was hidden or one check within it. */
  scope: 'finding' | 'check';
}

/** Tracks a finding, or a check within one, being hidden. */
export const trackRecommendationDismissed = recommendationEvents<FindingDismissed>('finding_dismissed');

/** Tracks hidden findings or checks being brought back. */
export const trackRecommendationRestored = recommendationEvents<FindingDismissed>('finding_restored');
