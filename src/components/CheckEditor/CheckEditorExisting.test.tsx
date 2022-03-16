import React from 'react';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import { GlobalSettings, ROUTES } from 'types';
import { getInstanceMock } from '../../datasource/__mocks__/DataSource';
import { InstanceContext } from 'contexts/InstanceContext';
import { AppPluginMeta, DataSourceSettings, FeatureToggles } from '@grafana/data';
import { FeatureFlagProvider } from 'components/FeatureFlagProvider';
import { Router, Route } from 'react-router-dom';
import { CheckEditor } from './CheckEditor';
import { locationService } from '@grafana/runtime';

import {
  BASIC_CHECK_LIST,
  EDITED_DNS_CHECK,
  EDITED_HTTP_CHECK,
  EDITED_TCP_CHECK,
  validCert,
  validKey,
} from './testConstants';
import { DNS_RESPONSE_MATCH_OPTIONS, PLUGIN_URL_PATH } from 'components/constants';
import { getSlider, submitForm, toggleSection } from './testHelpers';
import userEvent from '@testing-library/user-event';

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

const renderExistingCheckEditor = async (route: string) => {
  locationService.push(`${PLUGIN_URL_PATH}${ROUTES.Checks}${route}`);
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
          <Route path={`${PLUGIN_URL_PATH}${ROUTES.Checks}/edit/:id`}>
            <CheckEditor onReturn={onReturn} checks={BASIC_CHECK_LIST} />
          </Route>
        </Router>
      </InstanceContext.Provider>
    </FeatureFlagProvider>
  );

  await waitFor(() => expect(screen.getByText('Check Details')).toBeInTheDocument());
  return instance;
};

describe('editing checks', () => {
  it('renders the correct values on edit', async () => {
    await renderExistingCheckEditor('/edit/1');
    expect(await screen.findByLabelText('Job name', { exact: false })).toHaveValue('carne asada');
    expect(await screen.findByLabelText('Enabled', { exact: false })).toBeChecked();
    expect(await screen.findByLabelText('Full URL to send requests to', { exact: false })).toHaveValue(
      'https://target.com'
    );
    expect(await screen.findByText('burritos')).toBeInTheDocument();
    expect(await getSlider('frequency')).toHaveValue('120');
    expect(await getSlider('timeout')).toHaveValue('2');

    const httpSection = await toggleSection('HTTP settings');
    expect(await screen.findByText('GET')).toBeInTheDocument();
    expect(await screen.findByLabelText('Request body', { exact: false })).toHaveValue('requestbody');
    expect(await within(httpSection).findByPlaceholderText('name')).toHaveValue('headerName');
    expect(await within(httpSection).findByPlaceholderText('value')).toHaveValue('headerValue');
    expect(within(httpSection).getByTestId('http-compression')).toHaveValue('gzip');
    expect(await screen.findByLabelText('Proxy URL', { exact: false })).toHaveValue('https://grafana.com');

    await toggleSection('TLS config');
    expect(await screen.findByLabelText('Disable target certificate validation')).toBeChecked();
    expect(await screen.findByLabelText('Server name', { exact: false })).toHaveValue('serverName');
    expect(await screen.findByLabelText('CA certificate', { exact: false })).toHaveValue(validCert);
    expect(await screen.findByLabelText('Client certificate', { exact: false })).toHaveValue(validCert);
    expect(await screen.findByLabelText('Client key', { exact: false })).toHaveValue(validKey);

    await toggleSection('Authentication');
    expect(await screen.findByPlaceholderText('Bearer token')).toHaveValue('a bear');
    expect(await screen.findByPlaceholderText('Username')).toHaveValue('steve');
    expect(await screen.findByPlaceholderText('Password')).toHaveValue('stevessecurepassword');

    const validation = await toggleSection('Validation');

    expect(await within(validation).findByText('100')).toBeInTheDocument();
    expect(await within(validation).findByText('HTTP/1.0')).toBeInTheDocument();
    expect(await within(validation).findByText('Probe fails if SSL is not present.')).toBeInTheDocument();
    const [header1, header2] = await within(validation).findAllByPlaceholderText('Header name');
    expect(header1).toHaveValue('a header');
    expect(header2).toHaveValue('a different header');

    const advancedOptions = await toggleSection('Advanced options');
    expect(await within(advancedOptions).findByPlaceholderText('name')).toHaveValue('agreatlabel');
    expect(await within(advancedOptions).findByPlaceholderText('value')).toHaveValue('totally awesome label');
    expect(await within(advancedOptions).findByText('V6')).toBeInTheDocument();
    expect(await within(advancedOptions).findByLabelText('Follow redirects', { exact: false })).not.toBeChecked();
    expect(
      await within(advancedOptions).findByLabelText('Cache busting query parameter name', { exact: false })
    ).toHaveValue('busted');

    const alerting = await toggleSection('Alerting');
    const alertingValue = await within(alerting).findByText('Medium');
    expect(alertingValue).toBeInTheDocument();
  });

  it('transforms data from existing HTTP check', async () => {
    const instance = await renderExistingCheckEditor('/edit/1');

    const jobInput = await screen.findByLabelText('Job Name', { exact: false });
    userEvent.type(jobInput, 'tacos');

    // Set probe options
    const probeOptions = screen.getByText('Probe options').parentElement;
    if (!probeOptions) {
      throw new Error('Couldnt find Probe Options');
    }

    // Select burritos probe options
    const probeSelectMenu = await within(probeOptions).findByTestId('select');
    userEvent.selectOptions(probeSelectMenu, within(probeSelectMenu).getByText('burritos'));

    // HTTP Settings
    await toggleSection('HTTP settings');
    const requestBodyInput = await screen.findByLabelText('Request Body', { exact: false });
    await userEvent.paste(requestBodyInput, 'requestbody');
    userEvent.click(await screen.findByRole('button', { name: 'Add header' }));

    await act(async () => await userEvent.type(await screen.findByTestId('header-name-1'), 'headerName'));
    await act(async () => await userEvent.type(await screen.findByTestId('header-value-1'), 'headerValue'));
    const compression = await screen.findByTestId('http-compression');
    userEvent.selectOptions(compression, 'deflate');

    const proxyUrlInput = await screen.findByLabelText('Proxy URL', { exact: false });
    await userEvent.paste(proxyUrlInput, 'https://grafana.com');

    await toggleSection('HTTP settings');

    // TLS Config
    await toggleSection('TLS config');
    await act(async () => await userEvent.type(screen.getByLabelText('Server Name', { exact: false }), 'serverName'));
    // TextArea components misbehave when using userEvent.type, using paste for now as a workaround
    await act(async () => await userEvent.clear(screen.getByLabelText('CA Certificate', { exact: false })));
    await act(async () => await userEvent.paste(screen.getByLabelText('CA Certificate', { exact: false }), validCert));

    await act(async () => await userEvent.clear(screen.getByLabelText('Client Certificate', { exact: false })));
    await act(
      async () => await userEvent.paste(screen.getByLabelText('Client Certificate', { exact: false }), validCert)
    );

    await act(async () => await userEvent.clear(screen.getByLabelText('Client Key', { exact: false })));
    await act(async () => await userEvent.paste(screen.getByLabelText('Client Key', { exact: false }), validKey));
    await toggleSection('TLS config');

    // Authentication
    const authentication = await toggleSection('Authentication');

    const bearerTokenInput = await screen.findByPlaceholderText('Bearer token');
    await act(async () => await userEvent.type(bearerTokenInput, 'a bearer token'));

    // No need to check this checkbox because is already opened on load
    const usernameInput = await within(authentication).findByPlaceholderText('Username');
    const passwordInput = await within(authentication).findByPlaceholderText('Password');
    await act(async () => await userEvent.type(usernameInput, 'a username'));
    await act(async () => await userEvent.type(passwordInput, 'a password'));

    // Validation
    const validationSection = await toggleSection('Validation');
    const [statusCodeInput, httpVersionInput] = await within(validationSection).findAllByTestId('select');
    await userEvent.selectOptions(statusCodeInput, [within(validationSection).getByText('100')]);
    await userEvent.selectOptions(httpVersionInput, [within(validationSection).getByText('HTTP/1.0')]);
    const selectMenus = await within(validationSection).findAllByTestId('select');
    const [matchSelect1, matchSelect2] = selectMenus.slice(-2);
    userEvent.selectOptions(matchSelect1, ['Header']);

    await act(
      async () =>
        await userEvent.type(await within(validationSection).getAllByPlaceholderText('Header name')[0], 'Content-Type')
    );

    await act(
      async () =>
        await userEvent.type(await within(validationSection).getAllByPlaceholderText('Regex')[0], 'a header regex')
    );

    // const option = within(validationSection).getAllByText('Check fails if response body matches')[1];
    userEvent.selectOptions(matchSelect2, ['Body']);
    const regexFields = await within(validationSection).getAllByPlaceholderText('Regex');
    await act(async () => await userEvent.type(regexFields[1], 'a body regex'));

    const [allowMissing, invertMatch] = await within(validationSection).findAllByRole('checkbox');
    userEvent.click(allowMissing);
    userEvent.click(invertMatch);

    await submitForm(onReturn);
    expect(instance.api.addCheck).toHaveBeenCalledTimes(0);
    expect(instance.api.updateCheck).toHaveBeenCalledWith(EDITED_HTTP_CHECK);
  });

  it('transforms data correctly for TCP check', async () => {
    const instance = await renderExistingCheckEditor('/edit/4');

    await submitForm(onReturn);
    expect(instance.api.addCheck).toHaveBeenCalledTimes(0);
    expect(instance.api.updateCheck).toHaveBeenCalledWith(EDITED_TCP_CHECK);
  });

  it('transforms data correctly for DNS check', async () => {
    const instance = await renderExistingCheckEditor('/edit/2');
    await toggleSection('Validation');

    const responseMatch1 = await screen.findByTestId('dnsValidationResponseMatch0');
    userEvent.selectOptions(responseMatch1, DNS_RESPONSE_MATCH_OPTIONS[1].value);
    const responseMatch2 = await screen.findByTestId('dnsValidationResponseMatch1');
    userEvent.selectOptions(responseMatch2, DNS_RESPONSE_MATCH_OPTIONS[1].value);

    const expressionInputs = await screen.findAllByPlaceholderText('Type expression');
    await act(async () => await userEvent.clear(expressionInputs[0]));
    await act(async () => await userEvent.clear(expressionInputs[1]));
    await act(async () => await userEvent.type(expressionInputs[0], 'not inverted validation'));
    await userEvent.type(expressionInputs[1], 'inverted validation');
    const invertedCheckboxes = await screen.findAllByRole('checkbox');
    userEvent.click(invertedCheckboxes[2]);
    await submitForm(onReturn);
    expect(instance.api.addCheck).toHaveBeenCalledTimes(0);
    expect(instance.api.updateCheck).toHaveBeenCalledWith(EDITED_DNS_CHECK);
  });

  it('handles custom alert severities', async () => {
    await renderExistingCheckEditor('/edit/5');
    expect(true).toBeTruthy();
    await toggleSection('Alerting');

    const alertSensitivityInput = await screen.findByTestId('alertSensitivityInput');
    expect(alertSensitivityInput).toHaveValue('slightly sensitive');
  });
});
