import { createSMEventFactory, TrackingEventProps } from 'features/tracking/utils';

import { CheckType } from 'types';

const checkDashboardEvents = createSMEventFactory('check_dashboard');

interface CheckDashboardViewed extends TrackingEventProps {
  /** The type of check the dashboard belongs to. */
  checkType: CheckType;
  /** Whether the check had any failed executions in the queried time period. Undefined when uptime could not be determined. */
  hasFailures?: boolean;
  /** The uptime percentage (0-100) of the check over the queried time period. Undefined when uptime could not be determined. */
  uptime?: number;
}

/** Tracks when a check dashboard is viewed. */
export const trackCheckDashboardViewed = checkDashboardEvents<CheckDashboardViewed>('viewed');
