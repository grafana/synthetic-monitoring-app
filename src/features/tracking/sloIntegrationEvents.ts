import { createSMEventFactory, TrackingEventProps } from 'features/tracking/utils';

const sloIntegrationEvents = createSMEventFactory('slo_integration');

interface DrawerOpenedEvent extends TrackingEventProps {
  /** The number of SLOs already linked to the check when the drawer was opened. */
  sloCount: number;
}

/** Tracks when the linked-SLOs button on a check dashboard is clicked to open the drawer. */
export const trackSLOIntegrationDrawerOpened = sloIntegrationEvents<DrawerOpenedEvent>('drawer_opened');

/** Tracks when a new SLO is successfully created from the check dashboard wizard. */
export const trackSLOIntegrationWizardCompleted = sloIntegrationEvents('wizard_completed');

/** Tracks when the new SLO wizard is cancelled from the check dashboard. */
export const trackSLOIntegrationWizardCancelled = sloIntegrationEvents('wizard_cancelled');

/** Tracks when an SLO linked to a check is successfully deleted. */
export const trackSLOIntegrationSLODeleted = sloIntegrationEvents('slo_deleted');

/** Tracks when deleting an SLO linked to a check fails. */
export const trackSLOIntegrationSLODeleteFailed = sloIntegrationEvents('slo_delete_failed');
