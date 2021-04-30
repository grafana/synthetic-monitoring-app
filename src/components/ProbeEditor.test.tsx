import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProbeEditor from './ProbeEditor';
import { InstanceContext } from 'components/InstanceContext';
import { getInstanceMock, instanceSettings } from '../datasource/__mocks__/DataSource';
import { AppPluginMeta } from '@grafana/data';
import { GlobalSettings } from 'types';
import { SuccessRateContextProvider } from './SuccessRateContextProvider';

const defaultProbe = {
  name: '',
  public: false,
  latitude: 0.0,
  longitude: 0.0,
  region: '',
  labels: [],
  online: false,
  onlineChange: 0,
};
const onReturn = jest.fn();
const updateProbe = jest.fn().mockImplementation(() => Promise.resolve());

beforeEach(() => {
  onReturn.mockReset();
});

const renderProbeEditor = ({ probe = defaultProbe, updateProbeMock = updateProbe } = {}) => {
  const mockedInstance = getInstanceMock(instanceSettings);
  mockedInstance.updateProbe = updateProbeMock;
  const instance = { api: mockedInstance };
  const meta = {} as AppPluginMeta<GlobalSettings>;
  render(
    <InstanceContext.Provider value={{ instance, loading: false, meta }}>
      <SuccessRateContextProvider>
        <ProbeEditor probe={probe} onReturn={onReturn} />
      </SuccessRateContextProvider>
    </InstanceContext.Provider>
  );
  return instance;
};

describe('validation', () => {
  test('probe name', async () => {
    renderProbeEditor();
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
  test('Shows message for invalid latitude', async () => {
    renderProbeEditor();
    const latitudeInput = await screen.findByLabelText('Latitude', { exact: false });
    userEvent.type(latitudeInput, '444');
    const errorMessage = await screen.findByText('Must be between -90 and 90');
    expect(errorMessage).toBeInTheDocument();
  });
  test('Shows message for invalid longitude', async () => {
    renderProbeEditor();
    const longitudeInput = await screen.findByLabelText('Longitude', { exact: false });
    userEvent.type(longitudeInput, '444');
    const errorMessage = await screen.findByText('Must be between -180 and 180');
    expect(errorMessage).toBeInTheDocument();
  });
});

test('back button returns', async () => {
  renderProbeEditor();
  const backButton = await screen.findByRole('button', { name: 'Back' });
  userEvent.click(backButton);
  expect(onReturn).toHaveBeenCalledWith(false);
});

test('save button is disabled by invalid values', async () => {
  const validProbe = {
    name: 'valid probe',
    public: false,
    latitude: 44,
    longitude: 44,
    region: 'Narnia',
    labels: [],
    online: false,
    onlineChange: 0,
  };
  renderProbeEditor({ probe: validProbe });
  const saveButton = await screen.findByRole('button', { name: 'Save' });
  expect(saveButton).not.toBeDisabled();
  const longitudeInput = await screen.findByLabelText('Longitude', { exact: false });
  userEvent.type(longitudeInput, '444');
  const errorMessage = await screen.findByText('Must be between -180 and 180');
  expect(errorMessage).toBeInTheDocument();
  expect(saveButton).toBeDisabled();
});

test('saves new probe', async () => {
  const validProbe = {
    name: 'valid probe',
    public: false,
    latitude: 44.44,
    longitude: 44.44,
    region: 'Narnia',
    labels: [],
    online: false,
    onlineChange: 0,
  };
  const instance = renderProbeEditor({ probe: validProbe });
  const saveButton = await screen.findByRole('button', { name: 'Save' });
  userEvent.click(saveButton);
  await screen.findByText('Probe Authentication Token');
  expect(instance.api.addProbe).toHaveBeenCalledWith(validProbe);
});

test('updates existing probe', async () => {
  const validProbe = {
    id: 32,
    name: 'valid probe',
    public: false,
    latitude: 44,
    longitude: 44,
    region: 'Narnia',
    labels: [],
    online: false,
    onlineChange: 0,
  };
  const instance = renderProbeEditor({ probe: validProbe });
  const saveButton = await screen.findByRole('button', { name: 'Save' });
  userEvent.click(saveButton);
  await waitFor(() => expect(onReturn).toHaveBeenCalledWith(true));
  expect(instance.api.updateProbe).toHaveBeenCalledWith(validProbe);
});
