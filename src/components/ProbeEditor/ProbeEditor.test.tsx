import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { render } from 'test/render';

import { Probe, ROUTES } from 'types';
import { getRoute } from 'components/Routing';
import { TEMPLATE_PROBE } from 'page/NewProbe';

import { ProbeEditor } from './ProbeEditor';

const TEST_PROBE: Probe = {
  deprecated: false,
  labels: [],
  name: 'new probe',
  public: false,
  latitude: 22,
  longitude: 22,
  region: 'EMEA',
  online: false,
  onlineChange: 0,
  version: 'unknown',
};

const onSubmit = jest.fn();
const submitText = 'Save';

const renderProbeEditor = ({ probe = TEST_PROBE } = {}) => {
  const props = {
    onSubmit,
    probe,
    submitText,
  };

  return render(<ProbeEditor {...props} />);
};

describe('validation', () => {
  it('validates probe name', async () => {
    const { user } = renderProbeEditor({ probe: TEMPLATE_PROBE });
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
  const saveButton = await screen.findByRole('button', { name: 'Save' });
  expect(saveButton).not.toBeDisabled();
  const longitudeInput = await screen.findByLabelText('Longitude', { exact: false });
  await user.type(longitudeInput, '444');
  const errorMessage = await screen.findByText('Must be between -180 and 180');
  expect(errorMessage).toBeInTheDocument();
  expect(saveButton).toBeDisabled();
});

it('saves new probe', async () => {
  const { user } = renderProbeEditor();
  const updatedLatitude = 23;
  const updatedLongitude = 23;
  const updatedName = 'new probe';
  const updatedRegion = 'APAC';

  const latitudeInput = await screen.findByLabelText('Latitude', { exact: false });
  await user.clear(latitudeInput);
  await user.type(latitudeInput, updatedLatitude.toString());

  const longitudeInput = await screen.findByLabelText('Longitude', { exact: false });
  await user.clear(longitudeInput);
  await user.type(longitudeInput, updatedLongitude.toString());

  const nameInput = await screen.findByLabelText('Probe Name', { exact: false });
  await user.clear(nameInput);
  await user.type(nameInput, updatedName);

  const regionInput = await screen.findByPlaceholderText('Region', { exact: false });
  regionInput.focus();
  await user.clear(regionInput);
  await user.paste(updatedRegion);

  const saveButton = await screen.findByRole('button', { name: submitText });
  expect(saveButton).toBeEnabled();
  await user.click(saveButton);
  expect(onSubmit).toHaveBeenCalledWith({
    ...TEST_PROBE,
    region: updatedRegion,
    latitude: updatedLatitude,
    longitude: updatedLongitude,
    name: updatedName,
  });
});
