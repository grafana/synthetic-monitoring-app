import React from 'react';
import { screen } from '@testing-library/react';
import { PRIVATE_PROBE, PUBLIC_PROBE } from 'test/fixtures/probes';
import { render } from 'test/render';
import { fillProbeForm, probeToExtendedProbe, runTestAsRBACReader, runTestAsViewer, UPDATED_VALUES } from 'test/utils';

import { ExtendedProbe, Probe } from 'types';
import { TEMPLATE_PROBE } from 'page/NewProbe';

import { ProbeEditor } from './ProbeEditor';

const onSubmit = jest.fn();
const submitText = 'Save';

const renderProbeEditor = async ({
  probe = TEMPLATE_PROBE,
  forceViewMode,
}: { probe?: Probe | ExtendedProbe; forceViewMode?: boolean } = {}) => {
  const props = {
    onSubmit,
    probe: probeToExtendedProbe(probe),
    submitText,
    forceViewMode,
  };

  const res = render(<ProbeEditor {...props} />);
  await screen.findByText(/Probe Name */);
  return res;
};

describe('validation', () => {
  it('validates probe name', async () => {
    const { user } = await renderProbeEditor();
    const nameInput = await screen.findByLabelText('Probe Name', { exact: false });
    await user.type(nameInput, 'a name that is definitely too long and should definitely not be allowed to get typed');
    const maxLengthString = 'a name that is definitely too lo';
    expect(nameInput).toHaveValue(maxLengthString);
  });

  it('shows message for invalid latitude', async () => {
    const { user } = await renderProbeEditor();
    const latitudeInput = await screen.findByLabelText('Latitude', { exact: false });
    await user.type(latitudeInput, '444');
    const saveButton = await getSaveButton();
    await user.click(saveButton!);
    const errorMessage = await screen.findByText('Latitude must be less than 90');
    expect(errorMessage).toBeInTheDocument();
  });

  it('shows message for invalid longitude', async () => {
    const { user } = await renderProbeEditor();
    const longitudeInput = await screen.findByLabelText('Longitude', { exact: false });
    await user.type(longitudeInput, '444');
    const saveButton = await getSaveButton();
    await user.click(saveButton!);
    const errorMessage = await screen.findByText('Longitude must be less than 180');
    expect(errorMessage).toBeInTheDocument();
  });
});

it('renders the back button', async () => {
  await renderProbeEditor();
  const backButton = await screen.findByText('Back');
  expect(backButton).toBeInTheDocument();
});

it('disables save button on invalid values', async () => {
  const { user } = await renderProbeEditor();
  const saveButton = await getSaveButton();
  expect(saveButton).not.toBeDisabled();
  const longitudeInput = await screen.findByLabelText('Longitude', { exact: false });
  await user.type(longitudeInput, '444');
  await user.click(saveButton!);
  const errorMessage = await screen.findByText('Longitude must be less than 180');
  expect(errorMessage).toBeInTheDocument();
  expect(saveButton).toBeDisabled();
});

it('saves new probe', async () => {
  const probe = PRIVATE_PROBE;
  const { user } = await renderProbeEditor({ probe });
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
  await renderProbeEditor({ probe: PUBLIC_PROBE });
  await assertUneditable();
});

it('the form is uneditable when logged in as a viewer', async () => {
  runTestAsViewer();
  await renderProbeEditor();
  await assertUneditable();
});

it('the form is uneditable when logged in as a RBAC viewer', async () => {
  runTestAsRBACReader();
  await renderProbeEditor();
  await assertUneditable();
});

it('the form actions are unavailable when viewing a public probe', async () => {
  await renderProbeEditor({ probe: PUBLIC_PROBE });
  await assertNoActions();
});

it('the form actions are unavailable as a viewer', async () => {
  runTestAsViewer();
  await renderProbeEditor();
  await assertNoActions();
});

it('should render the form in read mode when passing `forceReadMode`', async () => {
  await renderProbeEditor({ probe: PRIVATE_PROBE, forceViewMode: true });
  await assertUneditable();
});

it('the form actions are unavailable as a RBAC viewer', async () => {
  runTestAsRBACReader();
  await renderProbeEditor();
  await assertNoActions();
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
  const addLabelButton = await screen.queryByText(/Add label/);
  expect(addLabelButton).not.toBeInTheDocument();

  const saveButton = await getSaveButton();
  expect(saveButton).toBeUndefined();
}

// extract this so we can be sure our assertions for them not being there are correct
function getSaveButton() {
  return screen.queryByText(submitText)?.parentNode as HTMLButtonElement | null;
}
