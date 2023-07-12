import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { CheckType, GlobalSettings, ROUTES } from 'types';
import { getInstanceMock } from '../../datasource/__mocks__/DataSource';
import { InstanceContext } from 'contexts/InstanceContext';
import { AppPluginMeta, DataSourceSettings, FeatureToggles } from '@grafana/data';
import { PLUGIN_URL_PATH } from 'components/constants';
import { FeatureFlagProvider } from 'components/FeatureFlagProvider';
import { Route, Router } from 'react-router-dom';
import { CheckEditor } from './CheckEditor';
import { submitForm, fillBasicCheckFields, fillDnsValidationFields, fillTCPQueryResponseFields } from './testHelpers';
import { BASIC_HTTP_CHECK, BASIC_PING_CHECK, BASIC_TCP_CHECK, BASIC_DNS_CHECK } from './testConstants';
import { locationService } from '@grafana/runtime';

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
  locationService.push(`${PLUGIN_URL_PATH}${ROUTES.Checks}/new/${checkType}`);
  const api = getInstanceMock();
  const instance = {
    api,
    alertRuler: {} as DataSourceSettings,
  };
  const meta = {} as AppPluginMeta<GlobalSettings>;
  const featureToggles = { traceroute: true, 'multi-http': false } as unknown as FeatureToggles;
  const isFeatureEnabled = jest.fn(() => false);

  render(
    <FeatureFlagProvider overrides={{ featureToggles, isFeatureEnabled }}>
      <InstanceContext.Provider value={{ instance, loading: false, meta }}>
        <Router history={locationService.getHistory()}>
          <Route path={`${PLUGIN_URL_PATH}${ROUTES.Checks}/new/:checkType`}>
            <CheckEditor onReturn={onReturn} />
          </Route>
        </Router>
      </InstanceContext.Provider>
    </FeatureFlagProvider>
  );

  await waitFor(() => expect(screen.getByText('Probe options')).toBeInTheDocument());
  return instance;
};

describe('new checks', () => {
  it('renders the new check form with PING if no checkType is passed in', async () => {
    await renderNewCheckEditor();
    expect(screen.getByText('Add Ping check')).toBeInTheDocument();
  });

  it('renders selectable options if multi-http FF is off AND should not include CheckType.MULTI_HTTP', async () => {
    await renderNewCheckEditor();
    await waitFor(() => expect(screen.getByText('Check type')).toBeInTheDocument());
    expect(screen.getByRole('option', { name: 'HTTP' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'DNS' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'TCP' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'MULTIHTTP' })).not.toBeInTheDocument();
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
    const instance = await renderNewCheckEditor(CheckType.HTTP);

    await fillBasicCheckFields('Job name', 'https://grafana.com');

    await submitForm(onReturn);
    expect(instance.api.addCheck).toHaveBeenCalledWith(BASIC_HTTP_CHECK);
  });

  it('can create a new PING check', async () => {
    const instance = await renderNewCheckEditor(CheckType.PING);

    await fillBasicCheckFields('Job name', 'grafana.com');

    await submitForm(onReturn);
    expect(instance.api.addCheck).toHaveBeenCalledWith(BASIC_PING_CHECK);
  });

  it('can create a new TCP check', async () => {
    const instance = await renderNewCheckEditor(CheckType.TCP);

    await fillBasicCheckFields('Job name', 'grafana.com:43');

    await fillTCPQueryResponseFields();
    await submitForm(onReturn);
    expect(instance.api.addCheck).toHaveBeenCalledWith(BASIC_TCP_CHECK);
  });

  it('can create a new DNS check', async () => {
    const instance = await renderNewCheckEditor(CheckType.DNS);

    await fillBasicCheckFields('Job name', 'grafana.com');
    await fillDnsValidationFields();

    await submitForm(onReturn);
    expect(instance.api.addCheck).toHaveBeenCalledWith(BASIC_DNS_CHECK);
  });
});
