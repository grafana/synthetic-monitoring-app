import { createSMEventFactory, TrackingEventProps } from 'features/tracking/utils';

import { CheckTypeGroup } from 'types';

const checkCreationEvents = createSMEventFactory('check_creation');

interface AddNewCheckButtonClicked extends TrackingEventProps {
  source: 'check-list' | 'homepage';
}

export const trackAddNewCheckButtonClicked =
  checkCreationEvents<AddNewCheckButtonClicked>('add_new_check_button_clicked');

interface AddCheckTypeGroupButtonClicked extends TrackingEventProps {
  checkTypeGroup: CheckTypeGroup;
}

export const trackAddCheckTypeGroupButtonClicked = checkCreationEvents<AddCheckTypeGroupButtonClicked>(
  'add_check_type_group_button_clicked'
);

interface AddCheckTypeButtonClicked extends TrackingEventProps {
  checkTypeGroup: CheckTypeGroup;
  protocol: string;
}

export const trackAddCheckTypeButtonClicked = checkCreationEvents<AddCheckTypeButtonClicked>(
  'add_check_type_button_clicked'
);
