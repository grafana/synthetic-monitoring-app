import { createSMEventFactory, TrackingEventProps } from 'features/tracking/utils';

const onboardingEvents = createSMEventFactory('onboarding');

interface AutoInitialized extends TrackingEventProps {
  /** The route the user deep-linked to that triggered auto-initialization. */
  route: string;
}

/** Tracks when the plugin auto-initializes successfully from a deep-link. */
export const trackAutoInitialized = onboardingEvents<AutoInitialized>('auto_initialized');

interface AutoInitializeFailed extends TrackingEventProps {
  /** The route the user deep-linked to that triggered auto-initialization. */
  route: string;
  /** The reason initialization failed. */
  reason: string;
}

/** Tracks when auto-initialization from a deep-link fails. */
export const trackAutoInitializeFailed = onboardingEvents<AutoInitializeFailed>('auto_initialize_failed');
