import React from 'react';
import DnsSettingsForm from './DnsSettings';
import { screen, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DnsResponseCodes, Label } from 'types';
import { MockFormWrapper } from '../__mocks__/MockFormWrapper';

jest.unmock('utils');
jest.setTimeout(10000);

const onUpdateMock = jest.fn();
const defaultSettings = {};
const defaultLabels: Label[] = [];

const renderDnsSettings = ({ isEditor = true, settings = defaultSettings, labels = defaultLabels } = {}) => {
  return render(
    <MockFormWrapper defaultValues={{ settings, labels }}>
      <DnsSettingsForm isEditor={isEditor} />
    </MockFormWrapper>
  );
};

beforeEach(() => {
  onUpdateMock.mockReset();
});

describe('Default values', () => {
  test('response codes default to NOERROR', async () => {
    renderDnsSettings();
    const validationExpandButton = await screen.findByText('Validation');
    userEvent.click(validationExpandButton);
    const noErrorResponseCode = await screen.findByText(DnsResponseCodes.NOERROR);
    expect(noErrorResponseCode).toBeInTheDocument();
  });

  test('DNS Settings', async () => {
    renderDnsSettings();
    const dnsSettings = await screen.findByText('DNS settings');
    userEvent.click(dnsSettings);
    expect(await screen.findByText('A')).toBeInTheDocument();
    expect(await screen.findByText('UDP')).toBeInTheDocument();
    const server = await screen.findByLabelText('Server');
    expect(server).toHaveValue('8.8.8.8');
    const port = await screen.findByLabelText('Port');
    expect(port).toHaveValue(53);
  });

  test('Advanced options', async () => {
    renderDnsSettings();
    const advancedExpand = await screen.findByText('Advanced options');
    userEvent.click(advancedExpand);
    const ipInput = await screen.findByText('V4');
    expect(ipInput).toBeInTheDocument();
  });
});
