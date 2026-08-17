import { createSMEventFactory, TrackingEventProps } from 'features/tracking/utils';

const onboardingEvents = createSMEventFactory('onboarding');

interface AutoInitialized extends TrackingEventProps {
  /** The route that triggered auto-initialization. */
  route: string;
}

/** Tracks a successful auto-initialization from a deep-link. */
export const trackAutoInitialized = onboardingEvents<AutoInitialized>('auto_initialized');

interface AutoInitializeFailed extends TrackingEventProps {
  /** The route that triggered auto-initialization. */
  route: string;
  /** Why initialization failed. */
  reason: string;
}

/** Tracks a failed auto-initialization from a deep-link. */
export const trackAutoInitializeFailed = onboardingEvents<AutoInitializeFailed>('auto_initialize_failed');
