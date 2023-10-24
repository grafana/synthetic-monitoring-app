import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route } from 'react-router-dom';

import { render } from 'test/render';
import ProbeEditor from './ProbeEditor';
import { getInstanceMock, instanceSettings } from '../../datasource/__mocks__/DataSource';
import { Probe, ROUTES } from 'types';
import { PLUGIN_URL_PATH } from '../constants';

jest.setTimeout(10000);

const onReturn = jest.fn().mockImplementation(() => true);
const updateProbe = jest.fn().mockImplementation(() => Promise.resolve());

beforeEach(() => {
  onReturn.mockReset();
});

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

const renderProbeEditor = ({ route = '/', probes = DEFAULT_PROBES, updateProbeMock = updateProbe } = {}) => {
  const mockedInstance = getInstanceMock(instanceSettings);
  mockedInstance.updateProbe = updateProbeMock;

  return render(
    <MemoryRouter initialEntries={[`${PLUGIN_URL_PATH}${ROUTES.Probes}${route}`]}>
      <Route path={`${PLUGIN_URL_PATH}${ROUTES.Probes}/new`}>
        <ProbeEditor probes={probes} onReturn={onReturn} />
      </Route>
      <Route path={`${PLUGIN_URL_PATH}${ROUTES.Probes}/edit/:id`}>
        <ProbeEditor probes={probes} onReturn={onReturn} />
      </Route>
    </MemoryRouter>,
    {
      instance: {
        api: mockedInstance,
      },
    }
  );
};

describe('validation', () => {
  it('validates probe name', async () => {
    const { user } = renderProbeEditor({ route: '/new' });
    const nameInput = await screen.findByLabelText('Probe Name', { exact: false });
    await user.type(nameInput, 'a name that is definitely too long and should definitely not be allowed to get typed');
    const maxLengthString = 'a name that is definitely too lo';
    expect(nameInput).toHaveValue(maxLengthString);
  });

  it('shows message for invalid latitude', async () => {
    const { user } = renderProbeEditor({ route: '/new' });
    const latitudeInput = await screen.findByLabelText('Latitude', { exact: false });
    await user.type(latitudeInput, '444');
    const errorMessage = await screen.findByText('Must be between -90 and 90');
    expect(errorMessage).toBeInTheDocument();
  });

  it('shows message for invalid longitude', async () => {
    const { user } = renderProbeEditor({ route: '/new' });
    const longitudeInput = await screen.findByLabelText('Longitude', { exact: false });
    await user.type(longitudeInput, '444');
    const errorMessage = await screen.findByText('Must be between -180 and 180');
    expect(errorMessage).toBeInTheDocument();
  });
});

it('returns on back buttun', async () => {
  const { user } = renderProbeEditor({ route: '/new' });
  const backButton = await screen.findByRole('button', { name: 'Back' });
  await user.click(backButton);
  expect(onReturn).toHaveBeenCalledWith(false);
});

it('disables save button on invalid values', async () => {
  const { user } = renderProbeEditor({ route: '/new' });
  const saveButton = await screen.findByRole('button', { name: 'Save' });
  expect(saveButton).not.toBeDisabled();
  const longitudeInput = await screen.findByLabelText('Longitude', { exact: false });
  await user.type(longitudeInput, '444');
  const errorMessage = await screen.findByText('Must be between -180 and 180');
  expect(errorMessage).toBeInTheDocument();
  expect(saveButton).toBeDisabled();
});

it('saves new probe', async () => {
  const { instance, user } = renderProbeEditor({ route: '/new' });

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
  const { instance, user } = renderProbeEditor({ route: '/edit/32' });
  const saveButton = await screen.findByRole('button', { name: 'Save' });
  await user.click(saveButton);
  await waitFor(() => expect(onReturn).toHaveBeenCalledWith(true));
  expect(instance.api?.updateProbe).toHaveBeenCalledWith(DEFAULT_PROBES[0]);
});
