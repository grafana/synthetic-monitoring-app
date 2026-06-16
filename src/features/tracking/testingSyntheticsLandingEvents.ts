import { createSMEventFactory, TrackingEventProps } from 'features/tracking/utils';

import { type LandingProduct, type SyntheticsTile } from './testingSyntheticsLandingEvents.types';

const testingSyntheticsLandingEvents = createSMEventFactory('testing_synthetics_landing');

interface LandingViewed extends TrackingEventProps {
  /** Whether the Agentic testing section was shown. */
  hasAgentic: boolean;
  /** Whether the Performance testing section was shown. */
  hasK6: boolean;
  /** Whether the Synthetic monitoring section was shown. */
  hasSynthetics: boolean;
}

/** Tracks when the Testing & synthetics landing page is viewed. */
export const trackTestingSyntheticsLandingViewed =
  testingSyntheticsLandingEvents<LandingViewed>('viewed');

/** Tracks when the Agentic Learn more button is clicked. */
export const trackAgenticLearnMoreButtonClicked = testingSyntheticsLandingEvents(
  'agentic_learn_more_button_clicked'
);

/** Tracks when the Agentic Create a test button is clicked. */
export const trackAgenticCreateButtonClicked = testingSyntheticsLandingEvents('agentic_create_button_clicked');

interface OpenLinkClicked extends TrackingEventProps {
  /** The product panel the Open link belongs to. */
  product: LandingProduct;
}

/** Tracks when an Open link is clicked. */
export const trackOpenLinkClicked = testingSyntheticsLandingEvents<OpenLinkClicked>('open_link_clicked');

/** Tracks when the Browse projects button is clicked. */
export const trackPerformanceBrowseProjectsButtonClicked = testingSyntheticsLandingEvents(
  'performance_browse_projects_button_clicked'
);

/** Tracks when the Start testing button is clicked. */
export const trackPerformanceStartTestingButtonClicked = testingSyntheticsLandingEvents(
  'performance_start_testing_button_clicked'
);

interface SyntheticsTileClicked extends TrackingEventProps {
  /** The synthetics action tile that was clicked. */
  tile: SyntheticsTile;
  /** Whether the tile container or its action button was clicked. */
  interaction: 'tile' | 'action-button';
}

/** Tracks when a Synthetic monitoring action tile is clicked. */
export const trackSyntheticsTileClicked =
  testingSyntheticsLandingEvents<SyntheticsTileClicked>('synthetics_tile_clicked');
