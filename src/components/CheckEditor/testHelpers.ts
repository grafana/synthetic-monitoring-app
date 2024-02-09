import { screen, within } from '@testing-library/react';
import { UserEvent } from '@testing-library/user-event';

import { CheckType } from 'types';
import { DNS_RESPONSE_MATCH_OPTIONS } from 'components/constants';

export const selectCheckType = async (checkType: CheckType, user: UserEvent) => {
  const checkTypeInput = await screen.findByText('PING');
  await user.click(checkTypeInput);
  const selectMenus = await screen.findAllByTestId('select');
  await user.selectOptions(selectMenus[0], checkType);
  await screen.findByText(checkType.toUpperCase());
};

export const toggleSection = async (sectionName: string, user: UserEvent): Promise<HTMLElement> => {
  const sectionHeader = await screen.findByText(sectionName);
  await user.click(sectionHeader);
  return sectionHeader.parentElement?.parentElement ?? new HTMLElement();
};

export const submitForm = async (user: UserEvent) => {
  const saveButton = await screen.findByRole('button', { name: 'Save' });
  expect(saveButton).not.toBeDisabled();
  await user.click(saveButton);
};

export const getSlider = async (formName: string) => {
  const container = await screen.findByTestId(formName);
  const input = (await within(container).findByRole('textbox')) as HTMLInputElement;
  return input;
};

export const fillBasicCheckFields = async (jobName: string, target: string, user: UserEvent) => {
  const jobNameInput = await screen.findByLabelText('Job Name', { exact: false });
  await user.type(jobNameInput, jobName);
  const targetInput = await screen.findByTestId('check-editor-target');
  await user.type(targetInput, target);

  // Set probe options
  const probeOptions = screen.getByText('Probe options').parentElement;
  if (!probeOptions) {
    throw new Error('Couldnt find Probe Options');
  }

  // Select burritos probe options
  const probeSelectMenu = await within(probeOptions).findByTestId('select');
  await user.selectOptions(probeSelectMenu, within(probeSelectMenu).getByText('burritos'));

  await toggleSection('Advanced options', user);
  const addLabel = await screen.findByRole('button', { name: 'Add label' });
  await user.click(addLabel);
  const labelNameInput = await screen.findByPlaceholderText('name');
  await user.type(labelNameInput, 'labelName');
  const labelValueInput = await screen.findByPlaceholderText('value');
  await user.type(labelValueInput, 'labelValue');
};

export const fillDnsValidationFields = async (user: UserEvent) => {
  await toggleSection('Validation', user);
  const addRegex = await screen.findByRole('button', { name: 'Add RegEx Validation' });
  await user.click(addRegex);
  await user.click(addRegex);
  const responseMatch1 = await screen.findByTestId('dnsValidationResponseMatch0');
  await user.selectOptions(responseMatch1, DNS_RESPONSE_MATCH_OPTIONS[0].value);
  const responseMatch2 = await screen.findByTestId('dnsValidationResponseMatch1');
  await user.selectOptions(responseMatch2, DNS_RESPONSE_MATCH_OPTIONS[0].value);
  const expressionInputs = await screen.findAllByPlaceholderText('Type expression');
  await user.type(expressionInputs[0], 'not inverted validation');
  await user.type(expressionInputs[1], 'inverted validation');
  const invertedCheckboxes = await screen.findAllByRole('checkbox');
  await user.click(invertedCheckboxes[2]);
};

export const fillTCPQueryResponseFields = async (user: UserEvent) => {
  const container = await toggleSection('Query/Response', user);
  const addQueryResp = await screen.findByRole('button', { name: 'Add query/response' });
  await user.click(addQueryResp);
  const responseInput = await within(container).findByPlaceholderText('Response to expect');
  await user.type(responseInput, 'STARTTLS');
  const queryInput = await within(container).findByPlaceholderText('Data to send');
  queryInput.focus();
  await user.paste('QUIT');
};
