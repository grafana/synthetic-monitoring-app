import { createSMEventFactory, TrackingEventProps } from 'features/tracking/utils';

const onboardingEvents = createSMEventFactory('onboarding');

interface AutoInitialized extends TrackingEventProps {
  route: string;
}

export const trackAutoInitialized = onboardingEvents<AutoInitialized>('auto_initialized');

interface AutoInitializeFailed extends TrackingEventProps {
  route: string;
  reason: string;
}

export const trackAutoInitializeFailed = onboardingEvents<AutoInitializeFailed>('auto_initialize_failed');
