import React from 'react';
import { render, screen } from '@testing-library/react';
import { CheckType, HttpMethod, IpVersion, DnsRecordType, DnsProtocol } from 'types';
import CheckTarget from './CheckTarget';
jest.unmock('utils');

const onChangeMock = jest.fn();

const checkSettingsMock = {
  http: { method: HttpMethod.GET, ipVersion: IpVersion.V4, noFollowRedirects: false },
  ping: { ipVersion: IpVersion.V4, dontFragment: false },
  dns: {
    ipVersion: IpVersion.V4,
    port: 53,
    protocol: DnsProtocol.TCP,
    recordType: DnsRecordType.A,
    server: 'dns.google',
  },
  tcp: { ipVersion: IpVersion.V4, tls: false },
};

const renderCheckTarget = ({
  target = '',
  typeOfCheck = CheckType.DNS,
  disabled = false,
  checkSettings = checkSettingsMock,
  onChange = onChangeMock,
} = {}) => render(<CheckTarget value={target} typeOfCheck={typeOfCheck} disabled={disabled} onChange={onChange} />);

beforeEach(() => {
  onChangeMock.mockReset();
});

describe('Target description is check type specific', () => {
  test('for DNS', async () => {
    renderCheckTarget();
    const description = screen.getByText('Name of record to query');
    expect(description).toBeInTheDocument();
  });
  test('for HTTP', async () => {
    renderCheckTarget({ typeOfCheck: CheckType.HTTP });
    const description = screen.getByText('Full URL to send requests to');
    expect(description).toBeInTheDocument();
  });
  test('for PING', async () => {
    renderCheckTarget({ typeOfCheck: CheckType.PING });
    const description = screen.getByText('Hostname to ping');
    expect(description).toBeInTheDocument();
  });
  test('for TCP', async () => {
    renderCheckTarget({ typeOfCheck: CheckType.TCP });
    const description = screen.getByText('Host:port to connect to');
    expect(description).toBeInTheDocument();
  });
});

describe('HTTP targets', () => {
  test('have query params in separate inputs', async () => {
    renderCheckTarget({ typeOfCheck: CheckType.HTTP, target: 'https://example.com?foo=bar' });
    const paramNameInput = screen.getByPlaceholderText('Key') as HTMLInputElement;
    const paramValueInput = screen.getByPlaceholderText('Value') as HTMLInputElement;
    expect(paramNameInput.value).toBe('foo');
    expect(paramValueInput.value).toBe('bar');
  });

  test('handles multiple query params', async () => {
    renderCheckTarget({ typeOfCheck: CheckType.HTTP, target: 'https://example.com?foo=bar&tacos=delicious' });
    const paramNameInputs = screen.getAllByPlaceholderText('Key') as HTMLInputElement[];
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
