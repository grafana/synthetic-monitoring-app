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

interface RecommendationDetailEvent extends TrackingEventProps {
  /** Identifier for the recommendation whose supporting detail changed. */
  opportunityId: string;
  /** Check type proposed by the recommendation. */
  checkType: 'http';
  /** Supporting detail section that the user expanded or collapsed. */
  detailType: 'evidence' | 'coverage' | 'configuration';
  /** Whether the supporting detail is open after the interaction. */
  open: boolean;
}

interface EvidenceInvestigationEvent extends TrackingEventProps {
  /** Identifier for the recommendation whose evidence the user investigates. */
  opportunityId: string;
  /** Check type proposed by the recommendation. */
  checkType: 'http';
  /** Grafana destination that contains the backing evidence. */
  destination: 'explore' | 'dashboard' | 'logs' | 'traces';
}

/** Tracks when the compact Reliability Inbox entry point is shown. */
export const trackInboxExposure = reliabilityInboxEvents<InboxExposureEvent>('exposed');
/** Tracks when a user enters the dedicated review surface. */
export const trackReviewEntryClicked = reliabilityInboxEvents<RecommendationEvent>('review_entry_clicked');
/** Tracks when a recommendation becomes selected for review. */
export const trackRecommendationReviewed = reliabilityInboxEvents<RecommendationEvent>('recommendation_reviewed');
/** Tracks when a user explicitly hands a recommendation to Assistant for guided setup. */
export const trackSetupWithAssistant = reliabilityInboxEvents<RecommendationEvent>('setup_with_assistant_clicked');
/** Tracks deliberate expansion and collapse of supporting recommendation details. */
export const trackRecommendationDetailToggled = reliabilityInboxEvents<RecommendationDetailEvent>(
  'recommendation_detail_toggled'
);
/** Tracks when a user follows a recommendation's backing evidence into Grafana. */
export const trackEvidenceInvestigationClicked = reliabilityInboxEvents<EvidenceInvestigationEvent>(
  'evidence_investigation_clicked'
);
