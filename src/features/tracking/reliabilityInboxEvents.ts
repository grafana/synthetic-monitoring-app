import { createSMEventFactory, TrackingEventProps } from 'features/tracking/utils';

const reliabilityInboxEvents = createSMEventFactory('reliability_inbox');

interface InboxExposureEvent extends TrackingEventProps {
  /** Number of reviewable recommendations shown by the inbox entry point. */
  opportunityCount: number;
  /** Identifier for the highest-priority recommendation shown on exposure. */
  topOpportunityId: string;
}

interface RecommendationEvent extends TrackingEventProps {
  /** Identifier for the recommendation involved in the interaction. */
  opportunityId: string;
  /** Check type proposed by the recommendation. */
  checkType: 'http';
}

/** Tracks when the compact Reliability Inbox entry point is shown. */
export const trackInboxExposure = reliabilityInboxEvents<InboxExposureEvent>('exposed');
/** Tracks when a user enters the dedicated review surface. */
export const trackReviewEntryClicked = reliabilityInboxEvents<RecommendationEvent>('review_entry_clicked');
/** Tracks when a recommendation becomes selected for review. */
export const trackRecommendationReviewed = reliabilityInboxEvents<RecommendationEvent>('recommendation_reviewed');
/** Tracks when a user explicitly hands a recommendation to Assistant for guided setup. */
export const trackSetupWithAssistant = reliabilityInboxEvents<RecommendationEvent>('setup_with_assistant_clicked');
