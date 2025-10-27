import { screen, within } from '@testing-library/react';
import { UserEvent } from '@testing-library/user-event';

import { FormSectionName } from '../types';

import { testUsesCombobox } from '../../../test/utils';
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

export async function selectComboboxOption(user: UserEvent, combobox: HTMLElement, value: RegExp | string) {
  testUsesCombobox();
  expect(combobox).toBeInTheDocument();
  let comboboxElement = combobox;

  // When using getter `getByLabelText` and the Combobox is labeled by an `aria-label` only, clicking the label element won't due.
  if (combobox.tagName !== 'INPUT') {
    // Get the actual combobox element
    comboboxElement = within(combobox).getByRole('combobox');
  }

  await user.click(comboboxElement);
  await user.click(screen.getByRole('option', { name: value }));
}

export async function selectRadioGroupOption(user: UserEvent, label: string | RegExp, valueLabel: string | RegExp) {
  const radioGroup = screen.getByRole('radiogroup', { name: label });
  await user.click(within(radioGroup).getByLabelText(valueLabel));
}
