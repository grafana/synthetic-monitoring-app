import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProbeEditor from './ProbeEditor';
import { InstanceContext } from 'contexts/InstanceContext';
import { getInstanceMock, instanceSettings } from '../../datasource/__mocks__/DataSource';
import { AppPluginMeta } from '@grafana/data';
import { GlobalSettings, Probe, ROUTES } from 'types';
import { MemoryRouter, Route } from 'react-router-dom';
import { PLUGIN_URL_PATH } from '../constants';

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
  const instance = { api: mockedInstance };
  const meta = {} as AppPluginMeta<GlobalSettings>;
  render(
    <MemoryRouter initialEntries={[`${PLUGIN_URL_PATH}${ROUTES.Probes}${route}`]}>
      <InstanceContext.Provider value={{ instance, loading: false, meta }}>
        <Route path={`${PLUGIN_URL_PATH}${ROUTES.Probes}/new`}>
          <ProbeEditor probes={probes} onReturn={onReturn} />
        </Route>
        <Route path={`${PLUGIN_URL_PATH}${ROUTES.Probes}/edit/:id`}>
          <ProbeEditor probes={probes} onReturn={onReturn} />
        </Route>
      </InstanceContext.Provider>
    </MemoryRouter>
  );
  return instance;
};

describe('validation', () => {
  it('validates probe name', async () => {
    renderProbeEditor({ route: '/new' });
    const nameInput = await screen.findByLabelText('Probe Name', { exact: false });
    await act(
      async () =>
        await userEvent.type(
          nameInput,
          'a name that is definitely too long and should definitely not be allowed to get typed'
        )
    );
    const maxLengthString = 'a name that is definitely too lo';
    expect(nameInput).toHaveValue(maxLengthString);
  });
  it('shows message for invalid latitude', async () => {
    renderProbeEditor({ route: '/new' });
    const latitudeInput = await screen.findByLabelText('Latitude', { exact: false });
    userEvent.type(latitudeInput, '444');
    const errorMessage = await screen.findByText('Must be between -90 and 90');
    expect(errorMessage).toBeInTheDocument();
  });
  it('shows message for invalid longitude', async () => {
    renderProbeEditor({ route: '/new' });
    const longitudeInput = await screen.findByLabelText('Longitude', { exact: false });
    userEvent.type(longitudeInput, '444');
    const errorMessage = await screen.findByText('Must be between -180 and 180');
    expect(errorMessage).toBeInTheDocument();
  });
});

it('returns on back buttun', async () => {
  renderProbeEditor({ route: '/new' });
  const backButton = await screen.findByRole('button', { name: 'Back' });
  userEvent.click(backButton);
  expect(onReturn).toHaveBeenCalledWith(false);
});

it('disables save button on invalid values', async () => {
  renderProbeEditor({ route: '/new' });
  const saveButton = await screen.findByRole('button', { name: 'Save' });
  expect(saveButton).not.toBeDisabled();
  const longitudeInput = await screen.findByLabelText('Longitude', { exact: false });
  userEvent.type(longitudeInput, '444');
  const errorMessage = await screen.findByText('Must be between -180 and 180');
  expect(errorMessage).toBeInTheDocument();
  expect(saveButton).toBeDisabled();
});

it('saves new probe', async () => {
  const instance = renderProbeEditor({ route: '/new' });

  const latitudeInput = await screen.findByLabelText('Latitude', { exact: false });
  userEvent.type(latitudeInput, '22');
  const longitudeInput = await screen.findByLabelText('Longitude', { exact: false });
  userEvent.type(longitudeInput, '22');
  const nameInput = await screen.findByLabelText('Probe Name', { exact: false });
  userEvent.type(nameInput, 'new probe');
  const regionInput = await screen.findByPlaceholderText('Region', { exact: false });
  userEvent.paste(regionInput, 'EMEA');

  const saveButton = await screen.findByRole('button', { name: 'Save' });
  expect(saveButton).toBeEnabled();
  userEvent.click(saveButton);
  await screen.findByText('Probe Authentication Token');
  expect(instance.api.addProbe).toHaveBeenCalledWith(TEST_PROBE);
});

it('updates existing probe', async () => {
  const instance = renderProbeEditor({ route: '/edit/32' });
  const saveButton = await screen.findByRole('button', { name: 'Save' });
  userEvent.click(saveButton);
  await waitFor(() => expect(onReturn).toHaveBeenCalledWith(true));
  expect(instance.api.updateProbe).toHaveBeenCalledWith(DEFAULT_PROBES[0]);
});
