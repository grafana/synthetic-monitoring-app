import { createSMEventFactory, TrackingEventProps } from 'features/tracking/utils';

import { CheckType } from 'types';

const checkListEvents = createSMEventFactory('check_list');

interface DuplicateCheckButtonClicked extends TrackingEventProps {
  /** The type of check being duplicated. */
  checkType: CheckType;
}

/** Tracks when the duplicate check button is clicked. */
export const trackDuplicateCheckButtonClicked = checkListEvents<DuplicateCheckButtonClicked>(
  'duplicate_check_button_clicked'
);
