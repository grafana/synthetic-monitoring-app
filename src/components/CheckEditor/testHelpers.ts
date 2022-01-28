import { screen, waitFor, act, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DNS_RESPONSE_MATCH_OPTIONS } from 'components/constants';
import { CheckType } from 'types';

export const selectCheckType = async (checkType: CheckType) => {
  const checkTypeInput = await screen.findByText('PING');
  userEvent.click(checkTypeInput);
  const selectMenus = await screen.findAllByTestId('select');
  userEvent.selectOptions(selectMenus[0], checkType);
  await screen.findByText(checkType.toUpperCase());
};

export const toggleSection = async (sectionName: string): Promise<HTMLElement> => {
  const sectionHeader = await screen.findByText(sectionName);
  userEvent.click(sectionHeader);
  return sectionHeader.parentElement?.parentElement ?? new HTMLElement();
};

export const submitForm = async (onReturn: (arg0: Boolean) => void) => {
  const saveButton = await screen.findByRole('button', { name: 'Save' });
  expect(saveButton).not.toBeDisabled();
  await act(async () => await userEvent.click(saveButton));
  await waitFor(() => expect(onReturn).toHaveBeenCalledWith(true));
};

export const getSlider = async (formName: string) => {
  const container = await screen.findByTestId(formName);
  const input = (await within(container).findByRole('textbox')) as HTMLInputElement;
  return input;
};

export const fillBasicCheckFields = async (checkType: CheckType, jobName: string, target: string) => {
  await selectCheckType(checkType);
  const jobNameInput = await screen.findByLabelText('Job Name', { exact: false });
  userEvent.type(jobNameInput, jobName);
  const targetInput = await screen.findByTestId('check-editor-target');
  userEvent.type(targetInput, target);

  // Set probe options
  const probeOptions = screen.getByText('Probe options').parentElement;
  if (!probeOptions) {
    throw new Error('Couldnt find Probe Options');
  }

  // Select burritos probe options
  const probeSelectMenu = await within(probeOptions).findByTestId('select');
  await act(async () => await userEvent.selectOptions(probeSelectMenu, within(probeSelectMenu).getByText('burritos')));

  await toggleSection('Advanced options');
  const addLabel = await screen.findByRole('button', { name: 'Add label' });
  userEvent.click(addLabel);
  const labelNameInput = await screen.findByPlaceholderText('name');
  userEvent.type(labelNameInput, 'labelName');
  const labelValueInput = await screen.findByPlaceholderText('value');
  userEvent.type(labelValueInput, 'labelValue');
};

export const fillDnsValidationFields = async () => {
  await toggleSection('Validation');
  const addRegex = await screen.findByRole('button', { name: 'Add RegEx Validation' });
  userEvent.click(addRegex);
  userEvent.click(addRegex);
  const responseMatch1 = await screen.findByTestId('dnsValidationResponseMatch0');
  userEvent.selectOptions(responseMatch1, DNS_RESPONSE_MATCH_OPTIONS[0].value);
  const responseMatch2 = await screen.findByTestId('dnsValidationResponseMatch1');
  userEvent.selectOptions(responseMatch2, DNS_RESPONSE_MATCH_OPTIONS[0].value);
  const expressionInputs = await screen.findAllByPlaceholderText('Type expression');
  userEvent.type(expressionInputs[0], 'not inverted validation');
  userEvent.type(expressionInputs[1], 'inverted validation');
  const invertedCheckboxes = await screen.findAllByRole('checkbox');
  userEvent.click(invertedCheckboxes[2]);
};
