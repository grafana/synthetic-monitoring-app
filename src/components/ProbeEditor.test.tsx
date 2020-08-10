import React from 'react';
import { render, screen } from '@testing-library/react';
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

const { mocks: instanceMocks, instance } = getInstanceMock();

const onReturn = jest.fn();

beforeEach(() => {
  Object.values(instanceMocks).forEach(mock => {
    mock.mockReset();
  });
  onReturn.mockReset();
});

const renderProbeEditor = ({ probe = defaultProbe } = {}) => {
  return render(<ProbeEditor probe={probe} instance={instance} onReturn={onReturn} />);
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
