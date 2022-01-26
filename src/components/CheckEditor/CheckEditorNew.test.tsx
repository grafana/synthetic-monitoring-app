import React from 'react';
import { render, screen, waitFor, act, within, fireEvent } from '@testing-library/react';
import {
  Check,
  IpVersion,
  CheckType,
  DnsResponseCodes,
  HttpMethod,
  HttpVersion,
  GlobalSettings,
  AlertSensitivity,
  HTTPCompressionAlgo,
  ROUTES,
  FilteredCheck,
} from 'types';
import { getInstanceMock } from '../../datasource/__mocks__/DataSource';
import userEvent from '@testing-library/user-event';
import { InstanceContext } from 'contexts/InstanceContext';
import { AppPluginMeta, DataSourceSettings, FeatureToggles } from '@grafana/data';
import { DNS_RESPONSE_MATCH_OPTIONS, PLUGIN_URL_PATH } from 'components/constants';
import { FeatureFlagProvider } from 'components/FeatureFlagProvider';
import { MemoryRouter, Router } from 'react-router-dom';
import { CheckEditor } from './CheckEditor';
import { selectCheckType, submitForm, BASIC_HTTP_CHECK } from './testHelpers';
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
  const featureToggles = ({ traceroute: true } as unknown) as FeatureToggles;
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
    await selectCheckType(CheckType.HTTP);

    const jobNameInput = await screen.findByLabelText('Job Name', { exact: false });

    await act(async () => await userEvent.paste(jobNameInput, 'Job name'));
    // expect(jobNameInput).toHaveAttribute('value', 'Job Name');

    const targetInput = await screen.findByTestId('check-editor-target');
    // console.log({ targetInput });

    userEvent.type(targetInput, 'https://grafana.com');
    // expect(targetInput).toHaveAttribute('value', 'https://grafana.com');
    // screen.debug(targetInput);
    // fireEvent.change(targetInput, { target: { value: 'https://grafana.com' } });
    // console.log({ targetInput });

    // Set probe options
    const probeOptions = screen.getByText('Probe options').parentElement;
    if (!probeOptions) {
      throw new Error('Couldnt find Probe Options');
    }

    // Select burritos probe options
    const probeSelectMenu = await within(probeOptions).findByTestId('select');
    await act(
      async () => await userEvent.selectOptions(probeSelectMenu, within(probeSelectMenu).getByText('burritos'))
    );

    // expect(jobNameInput).toHaveAttribute('value', 'Job Name');
    await submitForm(onReturn);
    // console.log('api', instance.api.addCheck);
    expect(instance.api.addCheck).toHaveBeenCalledWith(BASIC_HTTP_CHECK);

    // const addLabel = await screen.findByRole('button', { name: 'Add label' });
    // userEvent.click(addLabel);
    // const labelNameInput = await screen.findByPlaceholderText('name');
    // await act(async () => await userEvent.type(labelNameInput, 'labelName'));
    // const labelValueInput = await screen.findByPlaceholderText('value');
    // await act(async () => await userEvent.type(labelValueInput, 'labelValue'));
  });
});
