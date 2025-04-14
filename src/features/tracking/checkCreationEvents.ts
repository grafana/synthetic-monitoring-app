import { createSMEventFactory } from 'features/tracking/createEventFactory';

import { CheckType, CheckTypeGroup } from 'types';

const checkCreationEvents = createSMEventFactory('check_creation');

type AddNewCheckButtonClicked = {
  source: 'check-list' | 'homepage';
};

export const trackAddNewCheckButtonClicked =
  checkCreationEvents<AddNewCheckButtonClicked>('add_new_check_button_clicked');

type AddCheckTypeGroupButtonClicked = {
  checkTypeGroup: CheckTypeGroup;
};

export const trackAddCheckTypeGroupButtonClicked = checkCreationEvents<AddCheckTypeGroupButtonClicked>(
  'add_check_type_group_button_clicked'
);

type AddCheckTypeButtonClicked = {
  checkType: CheckType;
};

export const trackAddCheckTypeButtonClicked = checkCreationEvents<AddCheckTypeButtonClicked>(
  'add_check_type_button_clicked'
);
