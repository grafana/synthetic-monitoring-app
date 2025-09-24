import { createSMEventFactory, TrackingEventProps } from 'features/tracking/utils';

const featureFeedbackEvents = createSMEventFactory('feature_feedback');

interface FeatureFeedbackEvent extends TrackingEventProps {
  /** The type of feature. */
  feature: string;
  /** The reaction to the feature. */
  reaction: 'good' | 'bad';
}

/** Tracks when a feature feedback thumbs up or a thumbs down is clicked. */
export const trackFeatureFeedback = featureFeedbackEvents<FeatureFeedbackEvent>('feature_feedback_submitted');

interface FeatureFeedbackCommentEvent extends TrackingEventProps {
  /** The type of feature. */
  feature: string;
  /** The reaction to the feature. */
  reaction: 'good' | 'bad';
  /** The comment text. */
  comment: string;
}

/** Tracks when a feature feedback comment is submitted. */
export const trackFeatureFeedbackComment = featureFeedbackEvents<FeatureFeedbackCommentEvent>(
  'feature_feedback_comment_submitted'
);
