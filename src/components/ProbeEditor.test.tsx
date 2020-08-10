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
    // const inputs = await screen.findByRole('textbox');
    // const nameInput = inputs.find(input => input.placeholder === 'Probe name') as HTMLElement;
    // console.log(nameInput);
    // userEvent.click(nameInput)
    userEvent.type(nameInput, 'a name that is definitely too long and should have an error');
    const errorMessage = await screen.findByText('Must be less than 32 characters');
    screen.debug();
    expect(errorMessage).toBeInTheDocument();
  });
});
