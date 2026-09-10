import { createSMEventFactory, TrackingEventProps } from 'features/tracking/utils';

const recommendationEvents = createSMEventFactory('recommendations');

interface TabViewed extends TrackingEventProps {
  /** How many findings the tab had for this tenant, so an empty tab is distinguishable from an unread one. */
  findingCount: number;
  /** How many checks the tenant has, to read the findings against the size of the fleet. */
  checkCount: number;
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
  /** Whether the whole finding was opened or a single group within it. */
  scope: 'finding' | 'group';
}

/** Tracks a click through from a finding into the filtered check list. */
export const trackRecommendationActioned = recommendationEvents<FindingActioned>('finding_actioned');
