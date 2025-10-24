import { screen, within } from '@testing-library/react';
import { UserEvent } from '@testing-library/user-event';

import { FormSectionName } from '../types';

import { CHECKSTER_TEST_ID, DEFAULT_FORM_SECTION_ORDER } from '../constants';

export async function gotoSection(user: UserEvent, section: FormSectionName | number) {
  const tabList = screen.getByTestId(CHECKSTER_TEST_ID.navigation.root);
  const buttonIndex =
    typeof section === 'number'
      ? section
      : DEFAULT_FORM_SECTION_ORDER.findIndex((formSectionName) => formSectionName === section);

  const tabs = within(tabList).getAllByRole('tab');
  const tab = tabs[buttonIndex];

  await user.click(tab);
}

export async function submitForm(user: UserEvent) {
  const submitButton = screen.getByTestId(CHECKSTER_TEST_ID.form.submitButton);
  // expect(submitButton).toBeInTheDocument();
  await user.click(submitButton);
}
