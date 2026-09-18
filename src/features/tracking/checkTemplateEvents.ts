import { createSMEventFactory, TrackingEventProps } from 'features/tracking/utils';

const checkTemplateEvents = createSMEventFactory('check_templates');

interface CheckTemplateEvent extends TrackingEventProps {
  /** Stable template identifier. Never a URL, check name, or script. */
  check_template_id: 'broken_links' | 'ssl_certificate';
}

/** Tracks selection of a template card, before its configuration dialog opens. */
export const trackCheckTemplateSelected = checkTemplateEvents<CheckTemplateEvent>('template_selected');

/** Tracks a valid template configuration becoming a draft in the check form, not a saved check. */
export const trackCheckTemplateDraftCreated = checkTemplateEvents<CheckTemplateEvent>('draft_created');
