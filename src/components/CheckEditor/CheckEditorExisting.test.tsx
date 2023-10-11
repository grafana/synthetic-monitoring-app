import React from 'react';
import { screen, waitFor, within } from '@testing-library/react';
import { locationService } from '@grafana/runtime';
import { Router, Route } from 'react-router-dom';

import { render } from 'test/render';
import { ROUTES } from 'types';
import { CheckEditor } from './CheckEditor';

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

  const res = render(
    <Router history={locationService.getHistory()}>
      <Route path={`${PLUGIN_URL_PATH}${ROUTES.Checks}/edit/:id`}>
        <CheckEditor onReturn={onReturn} checks={BASIC_CHECK_LIST} />
      </Route>
    </Router>
  );

  await waitFor(() => expect(screen.getByText('Probe options')).toBeInTheDocument());
  return res;
};

describe('editing checks', () => {
  it('renders the correct values on edit', async () => {
    const { user } = await renderExistingCheckEditor('/edit/1');
    expect(await screen.findByLabelText('Job name', { exact: false })).toHaveValue('carne asada');
    expect(await screen.findByLabelText('Enabled', { exact: false })).toBeChecked();
    expect(await screen.findByLabelText('Full URL to send requests to', { exact: false })).toHaveValue(
      'https://target.com'
    );
    expect(await screen.findByText('burritos')).toBeInTheDocument();
    expect(await getSlider('frequency')).toHaveValue('120');
    expect(await getSlider('timeout')).toHaveValue('2');

    const httpSection = await toggleSection('HTTP settings', user);
    expect(await screen.findByText('GET')).toBeInTheDocument();
    expect(await screen.findByLabelText('Request body', { exact: false })).toHaveValue('requestbody');
    expect(await within(httpSection).findByPlaceholderText('name')).toHaveValue('headerName');
    expect(await within(httpSection).findByPlaceholderText('value')).toHaveValue('headerValue');
    expect(within(httpSection).getByTestId('http-compression')).toHaveValue('gzip');
    expect(await screen.findByLabelText('Proxy URL', { exact: false })).toHaveValue('https://grafana.com');

    await toggleSection('TLS config', user);
    expect(await screen.findByLabelText('Disable target certificate validation')).toBeChecked();
    expect(await screen.findByLabelText('Server name', { exact: false })).toHaveValue('serverName');
    expect(await screen.findByLabelText('CA certificate', { exact: false })).toHaveValue(validCert);
    expect(await screen.findByLabelText('Client certificate', { exact: false })).toHaveValue(validCert);
    expect(await screen.findByLabelText('Client key', { exact: false })).toHaveValue(validKey);

    await toggleSection('Authentication', user);
    expect(await screen.findByPlaceholderText('Bearer token')).toHaveValue('a bear');
    expect(await screen.findByPlaceholderText('Username')).toHaveValue('steve');
    expect(await screen.findByPlaceholderText('Password')).toHaveValue('stevessecurepassword');

    const validation = await toggleSection('Validation', user);

    expect(await within(validation).findByText('100')).toBeInTheDocument();
    expect(await within(validation).findByText('HTTP/1.0')).toBeInTheDocument();
    expect(await within(validation).findByText('Probe fails if SSL is not present.')).toBeInTheDocument();
    const [header1, header2] = await within(validation).findAllByPlaceholderText('Header name');
    expect(header1).toHaveValue('a header');
    expect(header2).toHaveValue('a different header');

    const advancedOptions = await toggleSection('Advanced options', user);
    expect(await within(advancedOptions).findByPlaceholderText('name')).toHaveValue('agreatlabel');
    expect(await within(advancedOptions).findByPlaceholderText('value')).toHaveValue('totally awesome label');
    expect(await within(advancedOptions).findByText('V6')).toBeInTheDocument();
    expect(await within(advancedOptions).findByLabelText('Follow redirects', { exact: false })).not.toBeChecked();
    expect(
      await within(advancedOptions).findByLabelText('Cache busting query parameter name', { exact: false })
    ).toHaveValue('busted');

    const alerting = await toggleSection('Alerting', user);
    const alertingValue = await within(alerting).findByText('Medium');
    expect(alertingValue).toBeInTheDocument();
  });

  it('transforms data from existing HTTP check', async () => {
    const { instance, user } = await renderExistingCheckEditor('/edit/1');

    const jobInput = await screen.findByLabelText('Job Name', { exact: false });
    await user.type(jobInput, 'tacos');

    // Set probe options
    const probeOptions = screen.getByText('Probe options').parentElement;
    if (!probeOptions) {
      throw new Error('Couldnt find Probe Options');
    }

    // Select burritos probe options
    const probeSelectMenu = await within(probeOptions).findByTestId('select');
    await user.selectOptions(probeSelectMenu, within(probeSelectMenu).getByText('burritos'));

    // HTTP Settings
    await toggleSection('HTTP settings', user);
    const requestBodyInput = await screen.findByLabelText('Request Body', { exact: false });
    requestBodyInput.focus();
    await user.paste('requestbody');
    await user.click(await screen.findByRole('button', { name: 'Add header' }));

    await user.type(await screen.findByTestId('header-name-1'), 'headerName');
    await user.type(await screen.findByTestId('header-value-1'), 'headerValue');

    const compression = await screen.findByTestId('http-compression');
    await user.selectOptions(compression, 'deflate');

    const proxyUrlInput = await screen.findByLabelText('Proxy URL', { exact: false });
    proxyUrlInput.focus();
    await user.paste('https://grafana.com');

    await toggleSection('HTTP settings', user);

    // TLS Config
    await toggleSection('TLS config', user);
    await user.type(screen.getByLabelText('Server Name', { exact: false }), 'serverName');
    // TextArea components misbehave when using userEvent.type, using paste for now as a workaround
    await user.clear(screen.getByLabelText('CA Certificate', { exact: false }));
    screen.getByLabelText('CA Certificate', { exact: false }).focus();
    await user.paste(validCert);

    await user.clear(screen.getByLabelText('Client Certificate', { exact: false }));
    screen.getByLabelText('Client Certificate', { exact: false }).focus();
    await user.paste(validCert);

    await user.clear(screen.getByLabelText('Client Key', { exact: false }));
    screen.getByLabelText('Client Key', { exact: false }).focus();
    await user.paste(validKey);
    await toggleSection('TLS config', user);

    // Authentication
    const authentication = await toggleSection('Authentication', user);

    const bearerTokenInput = await screen.findByPlaceholderText('Bearer token');
    await user.type(bearerTokenInput, 'a bearer token');

    // No need to check this checkbox because is already opened on load
    const usernameInput = await within(authentication).findByPlaceholderText('Username');
    const passwordInput = await within(authentication).findByPlaceholderText('Password');
    await user.type(usernameInput, 'a username');
    await user.type(passwordInput, 'a password');

    // Validation
    const validationSection = await toggleSection('Validation', user);
    const [statusCodeInput, httpVersionInput] = await within(validationSection).findAllByTestId('select');
    await user.selectOptions(statusCodeInput, [within(validationSection).getByText('100')]);
    await user.selectOptions(httpVersionInput, [within(validationSection).getByText('HTTP/1.0')]);
    const selectMenus = await within(validationSection).findAllByTestId('select');
    const [matchSelect1, matchSelect2] = selectMenus.slice(-2);
    await user.selectOptions(matchSelect1, ['Header']);

    await user.type(await within(validationSection).getAllByPlaceholderText('Header name')[0], 'Content-Type');

    await user.type(await within(validationSection).getAllByPlaceholderText('Regex')[0], 'a header regex');

    // const option = within(validationSection).getAllByText('Check fails if response body matches')[1];
    user.selectOptions(matchSelect2, ['Body']);
    const regexFields = await within(validationSection).getAllByPlaceholderText('Regex');
    await user.type(regexFields[1], 'a body regex');

    const [allowMissing, invertMatch] = await within(validationSection).findAllByRole('checkbox');
    await user.click(allowMissing);
    await user.click(invertMatch);

    await submitForm(onReturn, user);
    expect(instance.api.addCheck).toHaveBeenCalledTimes(0);
    expect(instance.api.updateCheck).toHaveBeenCalledWith(EDITED_HTTP_CHECK);
  });

  it('transforms data correctly for TCP check', async () => {
    const { instance, user } = await renderExistingCheckEditor('/edit/4');

    await submitForm(onReturn, user);
    expect(instance.api.addCheck).toHaveBeenCalledTimes(0);
    expect(instance.api.updateCheck).toHaveBeenCalledWith(EDITED_TCP_CHECK);
  });

  it('transforms data correctly for DNS check', async () => {
    const { instance, user } = await renderExistingCheckEditor('/edit/2');
    await toggleSection('Validation', user);

    const responseMatch1 = await screen.findByTestId('dnsValidationResponseMatch0');
    await user.selectOptions(responseMatch1, DNS_RESPONSE_MATCH_OPTIONS[1].value);
    const responseMatch2 = await screen.findByTestId('dnsValidationResponseMatch1');
    await user.selectOptions(responseMatch2, DNS_RESPONSE_MATCH_OPTIONS[1].value);

    const expressionInputs = await screen.findAllByPlaceholderText('Type expression');
    await user.clear(expressionInputs[0]);
    await user.clear(expressionInputs[1]);
    await user.type(expressionInputs[0], 'not inverted validation');
    await user.type(expressionInputs[1], 'inverted validation');
    const invertedCheckboxes = await screen.findAllByRole('checkbox');
    await user.click(invertedCheckboxes[2]);
    await submitForm(onReturn, user);
    expect(instance.api.addCheck).toHaveBeenCalledTimes(0);
    expect(instance.api.updateCheck).toHaveBeenCalledWith(EDITED_DNS_CHECK);
  });

  it('handles custom alert severities', async () => {
    const { user } = await renderExistingCheckEditor('/edit/5');
    expect(true).toBeTruthy();
    await toggleSection('Alerting', user);

    const alertSensitivityInput = await screen.findByTestId('alertSensitivityInput');
    expect(alertSensitivityInput).toHaveValue('slightly sensitive');
  });
});
