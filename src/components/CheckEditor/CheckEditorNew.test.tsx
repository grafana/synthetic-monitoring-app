import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { render } from 'test/render';

import { CheckType, ROUTES } from 'types';
import { PLUGIN_URL_PATH } from 'components/constants';

import { CheckEditor } from './CheckEditor';
import { BASIC_DNS_CHECK, BASIC_HTTP_CHECK, BASIC_PING_CHECK, BASIC_TCP_CHECK } from './testConstants';
import { fillBasicCheckFields, fillDnsValidationFields, fillTCPQueryResponseFields, submitForm } from './testHelpers';

jest.setTimeout(60000);

// Mock useAlerts hook
const setRulesForCheck = jest.fn();
jest.mock('hooks/useAlerts', () => ({
  useAlerts: () => ({
    alertRules: [],
    setRulesForCheck,
  }),
}));

beforeEach(() => jest.resetAllMocks());
const onReturn = jest.fn();

const renderNewCheckEditor = async (checkType?: CheckType) => {
  const res = render(<CheckEditor onReturn={onReturn} />, {
    route: `${PLUGIN_URL_PATH}${ROUTES.Checks}/new/:checkType`,
    path: `${PLUGIN_URL_PATH}${ROUTES.Checks}/new/${checkType}`,
  });

  await waitFor(() => expect(screen.getByText('Probe options')).toBeInTheDocument());
  return res;
};

describe('new checks', () => {
  it('renders the new check form with PING if no checkType is passed in', async () => {
    await renderNewCheckEditor();
    expect(screen.getByText('Add Ping check')).toBeInTheDocument();
  });

  it('renders the new check form with HTTP is checkType is passed in', async () => {
    await renderNewCheckEditor(CheckType.HTTP);
    expect(screen.getByText('Add Http check')).toBeInTheDocument();
  });

  it('has correct sections for HTTP', async () => {
    await renderNewCheckEditor(CheckType.HTTP);
    const httpSettings = await screen.findByText('HTTP settings');
    expect(httpSettings).toBeInTheDocument();
    const tlsConfig = await screen.findByText('TLS config');
    expect(tlsConfig).toBeInTheDocument();
    const authentication = await screen.findByText('Authentication');
    expect(authentication).toBeInTheDocument();
    const validation = await screen.findByText('Validation');
    expect(validation).toBeInTheDocument();
    const advanced = await screen.findByText('Advanced options');
    expect(advanced).toBeInTheDocument();
  });

  it('has correct sections for DNS', async () => {
    await renderNewCheckEditor(CheckType.DNS);
    // await selectCheckType(CheckType.DNS);
    const dnsSettings = await screen.findByText('DNS settings');
    expect(dnsSettings).toBeInTheDocument();
    const validation = await screen.findByText('Validation');
    expect(validation).toBeInTheDocument();
    const advancedOptions = await screen.findByText('Advanced options');
    expect(advancedOptions).toBeInTheDocument();
  });

  it('has correct sections for TCP', async () => {
    await renderNewCheckEditor(CheckType.TCP);
    // await selectCheckType(CheckType.TCP);
    const dnsSettings = await screen.findByText('TCP settings');
    expect(dnsSettings).toBeInTheDocument();
    const query = await screen.findAllByText('Query/Response');
    expect(query[0]).toBeInTheDocument();
    const advancedOptions = await screen.findByText('Advanced options');
    expect(advancedOptions).toBeInTheDocument();
  });

  it('can create a new HTTP check', async () => {
    const { instance, user } = await renderNewCheckEditor(CheckType.HTTP);

    await fillBasicCheckFields('Job name', 'https://grafana.com', user);
    await submitForm(onReturn, user);
    expect(instance.api?.addCheck).toHaveBeenCalledWith(BASIC_HTTP_CHECK);
  });

  it('can create a new PING check', async () => {
    const { instance, user } = await renderNewCheckEditor(CheckType.PING);

    await fillBasicCheckFields('Job name', 'grafana.com', user);
    await submitForm(onReturn, user);
    expect(instance.api?.addCheck).toHaveBeenCalledWith(BASIC_PING_CHECK);
  });

  it('can create a new TCP check', async () => {
    const { instance, user } = await renderNewCheckEditor(CheckType.TCP);

    await fillBasicCheckFields('Job name', 'grafana.com:43', user);

    await fillTCPQueryResponseFields(user);
    await submitForm(onReturn, user);
    expect(instance.api?.addCheck).toHaveBeenCalledWith(BASIC_TCP_CHECK);
  });

  it('can create a new DNS check', async () => {
    const { instance, user } = await renderNewCheckEditor(CheckType.DNS);

    await fillBasicCheckFields('Job name', 'grafana.com', user);
    await fillDnsValidationFields(user);

    await submitForm(onReturn, user);
    expect(instance.api?.addCheck).toHaveBeenCalledWith(BASIC_DNS_CHECK);
  });
});
