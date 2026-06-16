import { createSMEventFactory, TrackingEventProps } from 'features/tracking/utils';

const screenshotEvents = createSMEventFactory('screenshots');

interface ScreenshotExpandedEvent extends TrackingEventProps {
  /** Whether the screenshot has a caption. */
  hasCaption: boolean;
  /** The source type of the screenshot. */
  source: 'base64' | 'url';
}

/** Tracks when a screenshot thumbnail is clicked to expand. */
export const trackScreenshotExpanded = screenshotEvents<ScreenshotExpandedEvent>('expanded');

/** Tracks when an expanded screenshot modal is dismissed. */
export const trackScreenshotDismissed = screenshotEvents('dismissed');

interface HideScreenshotsToggledEvent extends TrackingEventProps {
  /** Whether screenshots are now hidden. */
  hidden: boolean;
}

/** Tracks when the hide screenshots toggle is changed. */
export const trackHideScreenshotsToggled = screenshotEvents<HideScreenshotsToggledEvent>('hide_toggled');

