import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { CheckType, GlobalSettings, ROUTES } from 'types';
import { getInstanceMock } from '../../datasource/__mocks__/DataSource';
import { InstanceContext } from 'contexts/InstanceContext';
import { AppPluginMeta, DataSourceSettings, FeatureToggles } from '@grafana/data';
import { PLUGIN_URL_PATH } from 'components/constants';
import { FeatureFlagProvider } from 'components/FeatureFlagProvider';
import { Router } from 'react-router-dom';
import { CheckEditor } from './CheckEditor';
import { selectCheckType, submitForm, fillBasicCheckFields, fillDnsValidationFields } from './testHelpers';
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

const renderNewCheckEditor = async () => {
  locationService.push(`${PLUGIN_URL_PATH}${ROUTES.Checks}/new`);
  const api = getInstanceMock();
  const instance = {
    api,
    alertRuler: {} as DataSourceSettings,
  };
  const meta = {} as AppPluginMeta<GlobalSettings>;
  const featureToggles = { traceroute: true } as unknown as FeatureToggles;
  const isFeatureEnabled = jest.fn(() => true);

  render(
    <FeatureFlagProvider overrides={{ featureToggles, isFeatureEnabled }}>
      <InstanceContext.Provider value={{ instance, loading: false, meta }}>
        <Router history={locationService.getHistory()}>
          <CheckEditor onReturn={onReturn} />
        </Router>
      </InstanceContext.Provider>
    </FeatureFlagProvider>
  );

  await waitFor(() => expect(screen.getByText('Check Details')).toBeInTheDocument());
  return instance;
};

describe('new checks', () => {
  it('renders the new check form', async () => {
    await renderNewCheckEditor();
    expect(screen.getByText('Add Check')).toBeInTheDocument();
  });

  it('has correct sections for HTTP', async () => {
    await renderNewCheckEditor();
    await selectCheckType(CheckType.HTTP);
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
    await renderNewCheckEditor();
    await selectCheckType(CheckType.DNS);
    const dnsSettings = await screen.findByText('DNS settings');
    expect(dnsSettings).toBeInTheDocument();
    const validation = await screen.findByText('Validation');
    expect(validation).toBeInTheDocument();
    const advancedOptions = await screen.findByText('Advanced options');
    expect(advancedOptions).toBeInTheDocument();
  });

  it('has correct sections for TCP', async () => {
    await renderNewCheckEditor();
    await selectCheckType(CheckType.TCP);
    const dnsSettings = await screen.findByText('TCP settings');
    expect(dnsSettings).toBeInTheDocument();
    const query = await screen.findAllByText('Query/Response');
    expect(query[0]).toBeInTheDocument();
    const advancedOptions = await screen.findByText('Advanced options');
    expect(advancedOptions).toBeInTheDocument();
  });

  it('can create a new HTTP check', async () => {
    const instance = await renderNewCheckEditor();

    await fillBasicCheckFields(CheckType.HTTP, 'Job name', 'https://grafana.com');

    await submitForm(onReturn);
    expect(instance.api.addCheck).toHaveBeenCalledWith(BASIC_HTTP_CHECK);
  });

  it('can create a new PING check', async () => {
    const instance = await renderNewCheckEditor();

    await fillBasicCheckFields(CheckType.PING, 'Job name', 'grafana.com');

    await submitForm(onReturn);
    expect(instance.api.addCheck).toHaveBeenCalledWith(BASIC_PING_CHECK);
  });

  it('can create a new TCP check', async () => {
    const instance = await renderNewCheckEditor();

    await fillBasicCheckFields(CheckType.TCP, 'Job name', 'grafana.com:43');

    await submitForm(onReturn);
    expect(instance.api.addCheck).toHaveBeenCalledWith(BASIC_TCP_CHECK);
  });

  it('can create a new DNS check', async () => {
    const instance = await renderNewCheckEditor();

    await fillBasicCheckFields(CheckType.DNS, 'Job name', 'grafana.com');
    await fillDnsValidationFields();

    await submitForm(onReturn);
    expect(instance.api.addCheck).toHaveBeenCalledWith(BASIC_DNS_CHECK);
  });
});
