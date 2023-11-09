import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { screen, waitFor } from '@testing-library/react';
import { render } from 'test/render';

import { Probe, ROUTES } from 'types';
import { getRoute } from 'components/Routing';

import { getInstanceMock, instanceSettings } from '../../datasource/__mocks__/DataSource';
import ProbeEditor from './ProbeEditor';

jest.setTimeout(10000);

const updateProbe = jest.fn().mockImplementation(() => Promise.resolve());

const DEFAULT_PROBES = [
  {
    name: 'tacos',
    id: 32,
    public: false,
    latitude: 0.0,
    longitude: 0.0,
    region: 'EMEA',
    labels: [{ name: 'Mr', value: 'Orange' }],
    online: true,
    onlineChange: 0,
  },
  {
    name: 'burritos',
    id: 42,
    public: true,
    latitude: 0.0,
    longitude: 0.0,
    region: 'AMER',
    labels: [{ name: 'Mr', value: 'Pink' }],
    online: false,
    onlineChange: 0,
  },
] as Probe[];

const TEST_PROBE = {
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

const renderProbeEditor = ({
  route = getRoute(ROUTES.NewProbe),
  probes = DEFAULT_PROBES,
  updateProbeMock = updateProbe,
} = {}) => {
  const mockedInstance = getInstanceMock(instanceSettings);
  mockedInstance.updateProbe = updateProbeMock;

  return render(
    <Switch>
      <Route path={getRoute(ROUTES.NewProbe)}>
        <ProbeEditor probes={probes} />
      </Route>
      <Route path={`${getRoute(ROUTES.EditProbe)}/:id`}>
        <ProbeEditor probes={probes} />
      </Route>
    </Switch>,
    {
      path: route,
      instance: {
        api: mockedInstance,
      },
    }
  );
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
  const saveButton = await screen.findByRole('button', { name: 'Save' });
  expect(saveButton).not.toBeDisabled();
  const longitudeInput = await screen.findByLabelText('Longitude', { exact: false });
  await user.type(longitudeInput, '444');
  const errorMessage = await screen.findByText('Must be between -180 and 180');
  expect(errorMessage).toBeInTheDocument();
  expect(saveButton).toBeDisabled();
});

it('saves new probe', async () => {
  const { instance, user } = renderProbeEditor();

  const latitudeInput = await screen.findByLabelText('Latitude', { exact: false });
  await user.type(latitudeInput, '22');
  const longitudeInput = await screen.findByLabelText('Longitude', { exact: false });
  await user.type(longitudeInput, '22');
  const nameInput = await screen.findByLabelText('Probe Name', { exact: false });
  await user.type(nameInput, 'new probe');
  const regionInput = await screen.findByPlaceholderText('Region', { exact: false });
  regionInput.focus();
  await user.paste('EMEA');

  const saveButton = await screen.findByRole('button', { name: 'Save' });
  expect(saveButton).toBeEnabled();
  await user.click(saveButton);
  await screen.findByText('Probe Authentication Token');
  expect(instance.api?.addProbe).toHaveBeenCalledWith(TEST_PROBE);
});

it('updates existing probe', async () => {
  const { instance, history, user } = renderProbeEditor({ route: `${getRoute(ROUTES.EditProbe)}/32` });
  const saveButton = await screen.findByRole('button', { name: 'Save' });
  await user.click(saveButton);
  await waitFor(() => {}, { timeout: 1000 });

  await waitFor(() => expect(history.location.pathname).toBe(getRoute(ROUTES.Probes)));
  expect(instance.api?.updateProbe).toHaveBeenCalledWith(DEFAULT_PROBES[0]);
});
