import { createSMEventFactory } from 'features/tracking/createEventFactory';

import { CheckType, CheckTypeGroup } from 'types';

const checkCreationEvents = createSMEventFactory('check_creation');

/**
 * Event type for when the "Add New Check" button is clicked
 */
type AddNewCheckButtonClicked = {
  /** The source of the click */
  source: 'check-list' | 'homepage';
};

/** Tracks when the "Add New Check" button is clicked */
export const trackAddNewCheckButtonClicked =
  checkCreationEvents<AddNewCheckButtonClicked>('add_new_check_button_clicked');

/**
 * Event type for when the "Add Check Type Group" button is clicked
 */
type AddCheckTypeGroupButtonClicked = {
  /** The type group of the check */
  checkTypeGroup: CheckTypeGroup;
};

/** Tracks when the "Add Check Type Group" button is clicked */
export const trackAddCheckTypeGroupButtonClicked = checkCreationEvents<AddCheckTypeGroupButtonClicked>(
  'add_check_type_group_button_clicked'
);

/**
 * Event type for when the "Add Check Type" button is clicked
 */
type AddCheckTypeButtonClicked = {
  /** The type of the check */
  checkType: CheckType;
};

/** Tracks when the "Add Check Type" button is clicked */
export const trackAddCheckTypeButtonClicked = checkCreationEvents<AddCheckTypeButtonClicked>(
  'add_check_type_button_clicked'
);
