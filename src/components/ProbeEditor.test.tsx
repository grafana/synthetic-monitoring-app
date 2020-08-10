import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProbeEditor from './ProbeEditor';
import { getInstanceMock } from '../datasource/__mocks__/DataSource';

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

beforeEach(() => {
  onReturn.mockReset();
});

const renderProbeEditor = ({ probe = defaultProbe } = {}) => {
  const instance = getInstanceMock();
  render(<ProbeEditor probe={probe} instance={instance} onReturn={onReturn} />);
  return instance;
};

describe('validation messages', () => {
  test('Shows message for probe name too long', async () => {
    renderProbeEditor();
    const nameInput = await screen.findByLabelText('Probe Name', { exact: false });
    userEvent.type(nameInput, 'a name that is definitely too long and should have an error');
    const errorMessage = await screen.findByText('Must be less than 32 characters');
    expect(errorMessage).toBeInTheDocument();
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
  expect(saveButton).toBeDisabled();
});

test('saves new probe', async () => {
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
  const instance = renderProbeEditor({ probe: validProbe });
  const saveButton = await screen.findByRole('button', { name: 'Save' });
  userEvent.click(saveButton);
  await screen.findByText('Probe Authentication Token');
  expect(instance.addProbe).toHaveBeenCalledWith(validProbe);
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
  expect(instance.updateProbe).toHaveBeenCalledWith(validProbe);
});
