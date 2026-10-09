import { createSMEventFactory, TrackingEventProps } from 'features/tracking/utils';

import { CheckTemplateId } from 'page/ChooseCheckGroup/components/templateTypes';

const checkTemplateEvents = createSMEventFactory('check_templates');

interface CheckTemplateEvent extends TrackingEventProps {
  /** Stable template identifier. Never a URL, check name, or script. */
  check_template_id: CheckTemplateId;
}

/** Tracks selection of a template card, before its configuration drawer opens. */
export const trackCheckTemplateSelected = checkTemplateEvents<CheckTemplateEvent>('template_selected');
