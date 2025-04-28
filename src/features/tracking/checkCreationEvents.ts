import { createSMEventFactory, TrackingEventProps } from 'features/tracking/utils';

import { CheckTypeGroup } from 'types';

const checkCreationEvents = createSMEventFactory('check_creation');

interface AddNewCheckButtonClicked extends TrackingEventProps {
  /** What location the button was clicked from. */
  source: 'check-list' | 'homepage';
}

/** Tracks when the "Add New Check" button is clicked. */
export const trackAddNewCheckButtonClicked =
  checkCreationEvents<AddNewCheckButtonClicked>('add_new_check_button_clicked');

interface AddCheckTypeGroupButtonClicked extends TrackingEventProps {
  /** The check group type of the check. */
  checkTypeGroup: CheckTypeGroup;
}

/** Tracks when the Primary Button of the check type card is clicked. */
export const trackAddCheckTypeGroupButtonClicked = checkCreationEvents<AddCheckTypeGroupButtonClicked>(
  'add_check_type_group_button_clicked'
);

interface AddCheckTypeButtonClicked extends TrackingEventProps {
  /** The check group type of the check. */
  checkTypeGroup: CheckTypeGroup;
  /** The protocol of the check. */
  protocol: string;
}

/** Tracks when the 'protocol' buttons on the check type card are clicked. */
export const trackAddCheckTypeButtonClicked = checkCreationEvents<AddCheckTypeButtonClicked>(
  'add_check_type_button_clicked'
);
