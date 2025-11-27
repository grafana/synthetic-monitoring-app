import { createSMEventFactory, TrackingEventProps } from 'features/tracking/utils';

const linkClicked = createSMEventFactory('link');

interface LinkEvent extends TrackingEventProps {
  /** The href of the clicked link */
  href: URL['href'];
  /** The hostname of the clicked link */
  hostname: URL['hostname'];
  /** The path of the clicked link */
  path: URL['pathname'];
  /** The search of the clicked link */
  search: URL['search'];
  /** Where the link was clicked from */
  source: string;
}

/** Tracks when a link is clicked. */
export const trackLinkClick = linkClicked<LinkEvent>('clicked');
