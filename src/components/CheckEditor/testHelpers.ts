import { screen, within } from '@testing-library/react';
import { UserEvent } from '@testing-library/user-event';
import { PRIVATE_PROBE } from 'test/fixtures/probes';

import { Label } from 'types';
import { DNS_RESPONSE_MATCH_OPTIONS } from 'components/constants';

export const toggleSection = async (sectionName: string, user: UserEvent): Promise<HTMLElement> => {
  // There can be overlap between section names and individual field names, so we need to search for section names in the sidebar only
  const sidebar = await screen.findByTestId('form-sidebar');
  const sectionRegexp = new RegExp(sectionName);
  const sectionHeader = await within(sidebar).findByRole('button', { name: sectionRegexp });
  await user.click(sectionHeader);
  const section = await screen.findAllByText(sectionRegexp);
  return section[1].parentElement ?? new HTMLElement();
};

export const submitForm = async (user: UserEvent) => {
  const saveButton = await screen.findByText('Save');
  expect(saveButton).not.toBeDisabled();
  await user.click(saveButton);
};

export const getSlider = async (formName: string) => {
  const container = await screen.findByTestId(formName);
  const minutes = await within(container).findByLabelText('minutes');
  const seconds = await within(container).findByLabelText('seconds');
  return [minutes, seconds];
};

export const fillBasicCheckFields = async (jobName: string, target: string, user: UserEvent, labels: Label[]) => {
  const jobNameInput = await screen.findByLabelText('Job Name', { exact: false });
  await user.type(jobNameInput, jobName);
  const targetInput = await screen.findByTestId('check-editor-target');
  await user.type(targetInput, target);

  // Set probe options
  await toggleSection(`Probes *`, user);
  const probeOptions = screen.getByText('Probe options');
  if (!probeOptions) {
    throw new Error('Couldnt find Probe Options');
  }

  // Select probe options
  await selectOption(user, { label: 'Probe locations', option: PRIVATE_PROBE.name });
  await toggleSection('Advanced options', user);

  for (const label of labels) {
    const addLabel = await screen.findByText('Add label');
    await user.click(addLabel);
    const labelNameInput = await screen.findByPlaceholderText('name');
    await user.type(labelNameInput, label.name);
    const labelValueInput = await screen.findByPlaceholderText('value');
    await user.type(labelValueInput, label.value);
  }
};

export const fillDnsValidationFields = async (user: UserEvent) => {
  await toggleSection('Validation', user);
  const addRegex = await screen.findByText(`Add Regex Validation`);
  await user.click(addRegex);
  await user.click(addRegex);
  const responseMatch1 = await screen.findByLabelText('DNS Response Match 1');
  await user.click(responseMatch1);
  await user.click(screen.getByText(DNS_RESPONSE_MATCH_OPTIONS[0].label, { selector: `span` }));

  const responseMatch2 = await screen.findByLabelText('DNS Response Match 2');
  await user.click(responseMatch2);
  await user.click(screen.getByText(DNS_RESPONSE_MATCH_OPTIONS[0].label, { selector: `span` }));

  const expressionInputs = await screen.findAllByPlaceholderText('Type expression');
  await user.type(expressionInputs[0], 'not inverted validation');
  await user.type(expressionInputs[1], 'inverted validation');
  const invertedCheckbox = await screen.findByLabelText('Invert match for regex 1');
  await user.click(invertedCheckbox);
};

export const fillTCPQueryResponseFields = async (user: UserEvent) => {
  const container = await toggleSection('Query/Response', user);
  const addQueryResp = await screen.findByText('Add query/response');
  await user.click(addQueryResp);
  const responseInput = await within(container).findByPlaceholderText('Response to expect');
  await user.type(responseInput, 'STARTTLS');
  const queryInput = await within(container).findByPlaceholderText('Data to send');
  queryInput.focus();
  await user.paste('QUIT');
};

type GetSelectProps =
  | {
      label: string;
    }
  | {
      text: string;
    };

export const getSelect = async (options: GetSelectProps) => {
  let selector;

  if ('label' in options) {
    selector = await screen.findByLabelText(options.label, { exact: false });
  }

  if ('text' in options) {
    selector = await screen.findByText(options.text);
  }

  const parent = selector!.parentElement?.parentElement?.parentElement as HTMLElement;
  const input = parent.querySelector(`input`) as HTMLInputElement;

  return [parent, input];
};

type SelectOptions = GetSelectProps & {
  option: string;
};

export const selectOption = async (user: UserEvent, options: SelectOptions) => {
  const [, input] = await getSelect(options);

  await user.click(input);
  const option = within(screen.getByLabelText(`Select options menu`)).getByText(options.option);

  await user.click(option);
};
