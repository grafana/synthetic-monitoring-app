import { createSMEventFactory, TrackingEventProps } from 'features/tracking/utils';

const checkTemplateEvents = createSMEventFactory('check_templates');

interface CheckTemplateEvent extends TrackingEventProps {
  /** Stable template identifier. Never a URL, check name, or script. */
  check_template_id: 'broken_links';
}

/** Tracks selection of a template card, before its configuration drawer opens. */
export const trackCheckTemplateSelected = checkTemplateEvents<CheckTemplateEvent>('template_selected');
