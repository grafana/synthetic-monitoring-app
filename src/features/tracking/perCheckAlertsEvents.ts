import { createSMEventFactory, TrackingEventProps } from 'features/tracking/utils';

import { CheckAlertDraft, CheckAlertPublished, CheckAlertType } from 'types';

const perCheckAlertEvents = createSMEventFactory('per_check_alerts');

interface PerCheckAlertEvent extends TrackingEventProps {
  /** The name of the alert */
  name: CheckAlertType;
}

interface PerCheckAlertChangePeriod extends TrackingEventProps {
  /** The name of the alert */
  name: CheckAlertType;
  /** The period of the alert */
  period: string;
}

interface PerCheckAlertChangeThreshold extends TrackingEventProps {
  /** The name of the alert */
  name: CheckAlertType;
  /** The threshold of the alert */
  threshold: number;
}
/** Tracks when an alert is selected from the per-check alerts list */
export const trackSelectAlert = perCheckAlertEvents<PerCheckAlertEvent>('select_alert');

/** Tracks when an alert is unselected from the per-check alerts list */
export const trackUnSelectAlert = perCheckAlertEvents<PerCheckAlertEvent>('unselect_alert');

/** Tracks when the period of an alert is changed */
export const trackChangePeriod = perCheckAlertEvents<PerCheckAlertChangePeriod>('change_period');

/** Tracks when the threshold of an alert is changed */
export const trackChangeThreshold = perCheckAlertEvents<PerCheckAlertChangeThreshold>('change_threshold');

/** Tracks when an alert is created successfully */
export const trackAlertCreationSuccess = perCheckAlertEvents<PerCheckAlertEvent>('creation_success');

/** Tracks when an alert is deleted successfully */
export const trackAlertDeletionSuccess = perCheckAlertEvents<PerCheckAlertEvent>('deletion_success');

export function trackAlertCreationsAndDeletions(
  prevAlerts: CheckAlertPublished[] = [],
  newAlerts: CheckAlertDraft[] = []
) {
  const prevMap = new Map(prevAlerts.map((a) => [a.name, a]));
  const newMap = new Map(newAlerts.map((a) => [a.name, a]));

  // Created: in new, not in prev
  for (const [name] of newMap) {
    if (!prevMap.has(name)) {
      trackAlertCreationSuccess({ name });
    }
  }
  // Deleted: in prev, not in new
  for (const [name] of prevMap) {
    if (!newMap.has(name)) {
      trackAlertDeletionSuccess({ name });
    }
  }
}
