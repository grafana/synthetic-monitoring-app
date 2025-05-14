import { createSMEventFactory, TrackingEventProps } from 'features/tracking/utils';

import { CheckAlertType } from 'types';

const perCheckAlertEvents = createSMEventFactory('per_check_alerts');

interface PerCheckAlertSelected extends TrackingEventProps {
  /** The name of the alert */
  name: CheckAlertType;
  /** The threshold of the alert */
  threshold: number;
  /** The period of the alert */
  period?: string;
}

/** Tracks when an alert is selected from the per-check alerts list */
export const trackSelectAlert = perCheckAlertEvents<PerCheckAlertSelected>('select_alert');

/** Tracks when an alert is unselected from the per-check alerts list */
export const trackUnSelectAlert = perCheckAlertEvents<PerCheckAlertSelected>('unselect_alert');
