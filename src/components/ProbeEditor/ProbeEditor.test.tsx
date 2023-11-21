import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { PRIVATE_PROBE, PUBLIC_PROBE } from 'test/fixtures';
import { render } from 'test/render';
import { fillProbeForm, runTestAsViewer, UPDATED_VALUES } from 'test/utils';

import { ROUTES } from 'types';
import { getRoute } from 'components/Routing';
import { TEMPLATE_PROBE } from 'page/NewProbe';

import { ProbeEditor } from './ProbeEditor';
import 'test/silenceErrors';

const onSubmit = jest.fn();
const submitText = 'Save';

const renderProbeEditor = ({ probe = TEMPLATE_PROBE } = {}) => {
  const props = {
    onSubmit,
    probe,
    submitText,
  };

  return render(<ProbeEditor {...props} />);
};

describe('validation', () => {
  it('validates probe name', async () => {
    const { user } = renderProbeEditor();
    const nameInput = await screen.findByLabelText('Probe Name', { exact: false });
    await user.type(nameInput, 'a name that is definitely too long and should definitely not be allowed to get typed');
    const maxLengthString = 'a name that is definitely too lo';
    expect(nameInput).toHaveValue(maxLengthString);
  });

  it('shows message for invalid latitude', async () => {
    const { user } = renderProbeEditor();
    const latitudeInput = await screen.findByLabelText('Latitude', { exact: false });
    await user.type(latitudeInput, '444');
    const errorMessage = await screen.findByText('Must be between -90 and 90');
    expect(errorMessage).toBeInTheDocument();
  });

  it('shows message for invalid longitude', async () => {
    const { user } = renderProbeEditor();
    const longitudeInput = await screen.findByLabelText('Longitude', { exact: false });
    await user.type(longitudeInput, '444');
    const errorMessage = await screen.findByText('Must be between -180 and 180');
    expect(errorMessage).toBeInTheDocument();
  });
});

it('returns on back button', async () => {
  const { history, user } = renderProbeEditor();
  const backButton = await screen.findByRole('link', { name: 'Back' });
  await user.click(backButton);
  await waitFor(() => {}, { timeout: 1000 });
  expect(history.location.pathname).toBe(getRoute(ROUTES.Probes));
});

it('disables save button on invalid values', async () => {
  const { user } = renderProbeEditor();
  const saveButton = await getSaveButton();
  expect(saveButton).not.toBeDisabled();
  const longitudeInput = await screen.findByLabelText('Longitude', { exact: false });
  await user.type(longitudeInput, '444');
  const errorMessage = await screen.findByText('Must be between -180 and 180');
  expect(errorMessage).toBeInTheDocument();
  expect(saveButton).toBeDisabled();
});

it('saves new probe', async () => {
  const probe = PRIVATE_PROBE;
  const { user } = renderProbeEditor({ probe });
  await fillProbeForm(user);

  const saveButton = await getSaveButton();
  expect(saveButton).toBeEnabled();
  await user.click(saveButton!);
  expect(onSubmit).toHaveBeenCalledWith({
    ...probe,
    ...UPDATED_VALUES,
    labels: [...probe.labels, ...UPDATED_VALUES.labels],
  });
});

it('the form is uneditable when viewing a public probe', async () => {
  renderProbeEditor({ probe: PUBLIC_PROBE });
  assertUneditable();
});

it('the form is uneditable when logged in as a viewer', async () => {
  runTestAsViewer();
  renderProbeEditor();
  assertUneditable();
});

it('the form actions are unavailable when viewing a public probe', async () => {
  renderProbeEditor({ probe: PUBLIC_PROBE });
  assertNoActions();
});

it('the form actions are unavailable as a viewer', async () => {
  runTestAsViewer();
  renderProbeEditor();
  assertNoActions();
});

async function assertUneditable() {
  const nameInput = await screen.findByLabelText('Probe Name', { exact: false });
  expect(nameInput).toBeDisabled();

  const latitudeInput = await screen.findByLabelText('Latitude', { exact: false });
  expect(latitudeInput).toBeDisabled();

  const longitudeInput = await screen.findByLabelText('Longitude', { exact: false });
  expect(longitudeInput).toBeDisabled();

  const regionInput = await screen.findByLabelText('Region', { exact: false });
  expect(regionInput).toBeDisabled();
}

async function assertNoActions() {
  const addLabelButton = await screen.findByRole('button', { name: /Add label/ });
  expect(addLabelButton).not.toBeInTheDocument();

  const saveButton = await getSaveButton();
  expect(saveButton).not.toBeInTheDocument();
}

// extract this so we can be sure our assertions for them not being there are correct
function getSaveButton() {
  return screen.queryByRole('button', { name: submitText });
}
