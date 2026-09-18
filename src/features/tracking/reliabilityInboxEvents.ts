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
}

interface NamespaceFilterEvent extends TrackingEventProps {
  /** How many namespaces the user had to choose between. */
  namespaceCount: number;
  /** True when the filter was cleared rather than set to a namespace. */
  cleared: boolean;
}

/** Tracks when the compact Reliability Inbox entry point is shown. */
export const trackInboxExposure = reliabilityInboxEvents<InboxExposureEvent>('exposed');
/** Tracks when a user enters the dedicated review surface. */
export const trackReviewEntryClicked = reliabilityInboxEvents<RecommendationEvent>('review_entry_clicked');
/** Tracks when a recommendation becomes selected for review. */
export const trackRecommendationReviewed = reliabilityInboxEvents<RecommendationEvent>('recommendation_reviewed');
/** Tracks when a user explicitly hands a recommendation to Assistant for guided setup. */
export const trackSetupWithAssistant = reliabilityInboxEvents<RecommendationEvent>('setup_with_assistant_clicked');
/** Tracks when a user takes a recommendation to the check form to create it themselves. */
export const trackCreateManually = reliabilityInboxEvents<RecommendationEvent>('create_manually_clicked');
/**
 * Tracks when a user narrows the queue to a namespace, or clears that filter.
 *
 * The namespace itself is deliberately NOT reported: its values are tenant
 * authored, so they are customer data, and "do teams filter at all?" — the
 * question this feature exists to answer — needs only the count and whether
 * the filter was set or cleared.
 */
export const trackNamespaceFilterChanged =
  reliabilityInboxEvents<NamespaceFilterEvent>('namespace_filter_changed');
