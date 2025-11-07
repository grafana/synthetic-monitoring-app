import { createSMEventFactory, TrackingEventProps } from 'features/tracking/utils';

const linkClicked = createSMEventFactory('link');

interface LinkEvent extends TrackingEventProps {
  /** The href of the clicked link */
  href: string;
  /** The hostname of the clicked link */
  hostname: string;
  /** The path of the clicked link */
  path: string;
  /** The search of the clicked link */
  search: string;
  /** Where the link was clicked from */
  source: string;
}

/** Tracks when a link is clicked. */
export const trackLinkClick = linkClicked<LinkEvent>('clicked');
