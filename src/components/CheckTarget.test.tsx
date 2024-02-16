import React from 'react';
import { screen } from '@testing-library/react';
import { render } from 'test/render';

import { CheckType } from 'types';

import CheckTarget from './CheckTarget';

const onChangeMock = jest.fn();

const renderCheckTarget = ({
  target = '',
  typeOfCheck = CheckType.DNS,
  disabled = false,
  onChange = onChangeMock,
} = {}) => render(<CheckTarget value={target} typeOfCheck={typeOfCheck} disabled={disabled} onChange={onChange} />);

describe('Target description is check type specific', () => {
  test('for DNS', async () => {
    renderCheckTarget();
    const description = await screen.findByText('Name of record to query');
    expect(description).toBeInTheDocument();
  });
  test('for HTTP', async () => {
    renderCheckTarget({ typeOfCheck: CheckType.HTTP });
    const description = await screen.findByText('Full URL to send requests to');
    expect(description).toBeInTheDocument();
  });
  test('for PING', async () => {
    renderCheckTarget({ typeOfCheck: CheckType.PING });
    const description = await screen.findByText('Hostname to ping');
    expect(description).toBeInTheDocument();
  });
  test('for TCP', async () => {
    renderCheckTarget({ typeOfCheck: CheckType.TCP });
    const description = await screen.findByText('Host:port to connect to');
    expect(description).toBeInTheDocument();
  });
});

describe('HTTP targets', () => {
  test('have query params in separate inputs', async () => {
    renderCheckTarget({ typeOfCheck: CheckType.HTTP, target: 'https://example.com?foo=bar' });
    const paramNameInput = (await screen.findByPlaceholderText('Key')) as HTMLInputElement;
    const paramValueInput = screen.getByPlaceholderText('Value') as HTMLInputElement;
    expect(paramNameInput.value).toBe('foo');
    expect(paramValueInput.value).toBe('bar');
  });

  test('handles multiple query params', async () => {
    await renderCheckTarget({ typeOfCheck: CheckType.HTTP, target: 'https://example.com?foo=bar&tacos=delicious' });
    const paramNameInputs = (await screen.findAllByPlaceholderText('Key')) as HTMLInputElement[];
    const paramValueInputs = screen.getAllByPlaceholderText('Value') as HTMLInputElement[];
    const expectedNameValues = ['foo', 'tacos'];
    const expectedValueValues = ['bar', 'delicious'];
    expect(paramNameInputs.length).toBe(2);
    expect(paramValueInputs.length).toBe(2);
    paramNameInputs.forEach((input) => {
      expect(expectedNameValues.includes(input.value)).toBe(true);
    });

    paramValueInputs.forEach((input) => {
      expect(expectedValueValues.includes(input.value)).toBe(true);
    });
  });
});
