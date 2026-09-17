import { screen, within } from '@testing-library/react';
import { UserEvent } from '@testing-library/user-event';
import { CHECKSTER_TEST_ID } from 'test/dataTestIds';

import { FormSectionName } from '../types';
import { DEFAULT_FORM_SECTION_ORDER } from 'components/Checkster/constants';

import { testUsesCombobox } from '../../../test/utils';

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

// New checks come with a default probe preselected, so tests that want a specific probe
// selected need to also unselect whatever the default preselected, rather than assuming
// every probe checkbox starts unchecked.
export async function selectOnlyProbe(user: UserEvent, name: string | RegExp) {
  const target = await screen.findByRole('checkbox', { name });
  const probeCheckboxes = screen.getAllByTestId(CHECKSTER_TEST_ID.form.inputs.probeCheckbox);

  for (const checkbox of probeCheckboxes) {
    const shouldBeChecked = checkbox === target;
    if ((checkbox as HTMLInputElement).checked !== shouldBeChecked) {
      await user.click(checkbox);
    }
  }
}

export async function deselectAllProbes(user: UserEvent) {
  const probeCheckboxes = screen.getAllByTestId(CHECKSTER_TEST_ID.form.inputs.probeCheckbox);

  for (const checkbox of probeCheckboxes) {
    if ((checkbox as HTMLInputElement).checked) {
      await user.click(checkbox);
    }
  }
}

export async function removeComboboxOption(user: UserEvent, label: string | RegExp) {
  testUsesCombobox();

  await user.click(screen.getByRole('button', { name: `Remove ${label}` }));
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

// Grafana UI checkbox doesn't play nice with getByLabelText
export function getCheckbox(label: string | RegExp) {
  const labelElement = screen.getByText(label);
  expect(labelElement).toBeInTheDocument();

  if (!labelElement || !labelElement.parentElement) {
    throw new Error('label element does not exist');
  }

  return labelElement.parentElement;
}
