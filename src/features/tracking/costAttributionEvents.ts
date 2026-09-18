import { createSMEventFactory, TrackingEventProps } from 'features/tracking/utils';

const costAttributionEvents = createSMEventFactory('cost_attribution');

interface SetupBannerShown extends TrackingEventProps {
  /** The number of checks the tenant has when the banner was shown. */
  checkCount: number;
}

/** Tracks when the cost attribution setup banner is shown on the check list. */
export const trackSetupBannerShown = costAttributionEvents<SetupBannerShown>('setup_banner_shown');

interface SetupBannerDismissed extends TrackingEventProps {
  /** True for "Understood, don't show again", false for the session-only close button. */
  permanent: boolean;
}

/** Tracks when the cost attribution setup banner is dismissed. */
export const trackSetupBannerDismissed = costAttributionEvents<SetupBannerDismissed>('setup_banner_dismissed');

interface CmabLinkClicked extends TrackingEventProps {
  /** Which nudge the link was clicked from. */
  source: 'check_list_banner' | 'check_form_labels' | 'check_list_usage_tooltip' | 'check_form_usage_footer';
  /** The usage metric the nudge was attached to, when clicked from a usage tooltip. */
  metric?: 'active_series' | 'executions_per_month';
}

/** Tracks when a link to the Cost Management and Billing app is clicked from a cost attribution nudge. */
export const trackCmabLinkClicked = costAttributionEvents<CmabLinkClicked>('cmab_link_clicked');
