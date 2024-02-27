import React from 'react';
import { screen, waitFor, within } from '@testing-library/react';
import { DataTestIds } from 'test/dataTestIds';
import {
  BASIC_DNS_CHECK,
  BASIC_TCP_CHECK,
  CUSTOM_ALERT_SENSITIVITY_CHECK,
  FULL_HTTP_CHECK,
  validCert,
  validKey,
} from 'test/fixtures/checks';
import { PRIVATE_PROBE, UNSELECTED_PRIVATE_PROBE } from 'test/fixtures/probes';
import { apiRoute, getServerRequests } from 'test/handlers';
import { render } from 'test/render';
import { server } from 'test/server';

import { ROUTES } from 'types';
import { DNS_RESPONSE_MATCH_OPTIONS, PLUGIN_URL_PATH } from 'components/constants';

import { CheckEditor } from './CheckEditor';
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

const renderExistingCheckEditor = async (route: string) => {
  const res = waitFor(() =>
    render(<CheckEditor />, {
      route: `${PLUGIN_URL_PATH}${ROUTES.Checks}/edit/:id`,
      path: `${PLUGIN_URL_PATH}${ROUTES.Checks}${route}`,
    })
  );

  return res;
};

describe('editing checks', () => {
  it('renders the correct values on edit', async () => {
    const targetCheck = FULL_HTTP_CHECK;
    const { alertSensitivity, labels, settings } = targetCheck;
    const {
      // failIfNotSSL,
      basicAuth,
      bearerToken,
      body,
      cacheBustingQueryParamName,
      compression,
      failIfHeaderMatchesRegexp,
      failIfHeaderNotMatchesRegexp,
      headers,
      ipVersion,
      proxyURL,
      tlsConfig,
      validHTTPVersions,
      validStatusCodes,
    } = settings.http!;
    const [headerName, headerValue] = headers![0].split(`:`);

    const { user } = await renderExistingCheckEditor(`/edit/${targetCheck.id}`);
    expect(await screen.findByLabelText('Job name', { exact: false })).toHaveValue(targetCheck.job);
    expect(await screen.findByLabelText('Enabled', { exact: false })).toBeChecked();
    expect(await screen.findByLabelText('Full URL to send requests to', { exact: false })).toHaveValue(
      targetCheck.target
    );
    expect(await screen.findByText(PRIVATE_PROBE.name)).toBeInTheDocument();
    expect(await getSlider('frequency')).toHaveValue((targetCheck.frequency / 1000).toString());
    expect(await getSlider('timeout')).toHaveValue((targetCheck.timeout / 1000).toString());

    const httpSection = await toggleSection('HTTP settings', user);
    expect(await screen.findByText('GET')).toBeInTheDocument();
    expect(await screen.findByLabelText('Request body', { exact: false })).toHaveValue(body);
    expect(await within(httpSection).findByPlaceholderText('name')).toHaveValue(headerName);
    expect(await within(httpSection).findByPlaceholderText('value')).toHaveValue(headerValue);
    expect(within(httpSection).getByText(compression!));
    expect(await screen.findByLabelText('Proxy URL', { exact: false })).toHaveValue(proxyURL);

    await toggleSection('TLS config', user);
    expect(await screen.findByLabelText('Disable target certificate validation')).toBeChecked();
    expect(await screen.findByLabelText('Server name', { exact: false })).toHaveValue(tlsConfig?.serverName);
    expect(await screen.findByLabelText('CA certificate', { exact: false })).toHaveValue(validCert);
    expect(await screen.findByLabelText('Client certificate', { exact: false })).toHaveValue(validCert);
    expect(await screen.findByLabelText('Client key', { exact: false })).toHaveValue(validKey);

    await toggleSection('Authentication', user);
    expect(await screen.findByPlaceholderText('Bearer token')).toHaveValue(bearerToken);
    expect(await screen.findByPlaceholderText('Username')).toHaveValue(basicAuth?.username);
    expect(await screen.findByPlaceholderText('Password')).toHaveValue(basicAuth?.password);

    const validation = await toggleSection('Validation', user);

    expect(await within(validation).findByText(validStatusCodes![0])).toBeInTheDocument();
    expect(await within(validation).findByText(validHTTPVersions![0])).toBeInTheDocument();
    // failIfNotSSL
    expect(await within(validation).findByText('Probe fails if SSL is not present.')).toBeInTheDocument();
    const [header1, header2] = await within(validation).findAllByPlaceholderText('Header name');
    expect(header1).toHaveValue(failIfHeaderMatchesRegexp![0].header);
    expect(header2).toHaveValue(failIfHeaderNotMatchesRegexp![0]?.header);

    const advancedOptions = await toggleSection('Advanced options', user);
    expect(await within(advancedOptions).findByPlaceholderText('name')).toHaveValue(labels[0].name);
    expect(await within(advancedOptions).findByPlaceholderText('value')).toHaveValue(labels[0].value);
    expect(await within(advancedOptions).findByText(ipVersion)).toBeInTheDocument();
    expect(await within(advancedOptions).findByLabelText('Follow redirects', { exact: false })).not.toBeChecked();
    expect(
      await within(advancedOptions).findByLabelText('Cache busting query parameter name', { exact: false })
    ).toHaveValue(cacheBustingQueryParamName);

    const alerting = await toggleSection('Alerting', user);
    const alertingValue = await within(alerting).findByText(alertSensitivity, { exact: false });
    expect(alertingValue).toBeInTheDocument();
  });

  it('transforms data from existing HTTP check', async () => {
    const { read, record } = getServerRequests();
    server.use(apiRoute(`updateCheck`, {}, record));
    const targetCheck = FULL_HTTP_CHECK;
    const { user } = await renderExistingCheckEditor(`/edit/${targetCheck.id}`);
    const JOB_SUFFIX = 'tacos';
    const NEW_HEADER = {
      name: 'new headerName',
      value: 'new headerValue',
    };
    const COMPRESSION = 'deflate';
    const PROXY_URL = 'http://proxy.url';
    const BODY = 'a body';
    const SERVER_NAME_SUFFIX = 'serverNameSuffix';
    const BEARER_TOKEN = 'a bearerToken';
    const USERNAME = 'a username';
    const PASSWORD = 'a password';
    const STATUS_CODE = 100;
    const HTTP_VERSION = 'HTTP/1.1';
    const HEADER_NAME = 'a new header name';
    const REGEX = 'a regex';
    const BODY_REGEX = 'a body regex';

    const jobInput = await screen.findByLabelText(`Job name`, { exact: false });
    await user.type(jobInput, JOB_SUFFIX);

    // Set probe options
    const probeOptions = screen.getByText('Probe options').parentElement;
    if (!probeOptions) {
      throw new Error('Couldnt find Probe Options');
    }

    // Select burritos probe options

    await user.click(screen.getByText(`Clear`));
    const probeSelectMenu = await within(probeOptions).getByLabelText('Probe locations', { exact: false });
    await user.click(probeSelectMenu);
    await user.click(screen.getByText(UNSELECTED_PRIVATE_PROBE.name, { exact: false }));

    // HTTP Settings
    await toggleSection('HTTP settings', user);
    const requestBodyInput = await screen.findByLabelText('Request Body', { exact: false });
    requestBodyInput.focus();
    await user.clear(requestBodyInput);
    await user.paste(BODY);
    await user.click(await screen.findByRole('button', { name: 'Add header' }));

    await user.type(await screen.findByTestId('header-name-1'), NEW_HEADER.name);
    await user.type(await screen.findByTestId('header-value-1'), NEW_HEADER.value);

    const compression = await screen.getByLabelText('Compression option', { exact: false });
    await user.click(compression);
    await user.click(screen.getByText(COMPRESSION, { exact: false }));

    const proxyUrlInput = await screen.findByLabelText('Proxy URL', { exact: false });
    proxyUrlInput.focus();
    await user.clear(proxyUrlInput);
    await user.paste(PROXY_URL);

    await toggleSection('HTTP settings', user);

    // TLS Config
    await toggleSection('TLS config', user);
    await user.type(screen.getByLabelText('Server Name', { exact: false }), SERVER_NAME_SUFFIX);
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
    await user.clear(bearerTokenInput);
    await user.type(bearerTokenInput, BEARER_TOKEN);

    // No need to check this checkbox because is already opened on load
    const usernameInput = await within(authentication).findByPlaceholderText('Username');
    const passwordInput = await within(authentication).findByPlaceholderText('Password');
    await user.clear(usernameInput);
    await user.clear(passwordInput);

    await user.type(usernameInput, USERNAME);
    await user.type(passwordInput, PASSWORD);

    // Validation
    const validationSection = await toggleSection('Validation', user);

    await user.click(screen.getByLabelText(`Valid status codes`, { exact: false }));
    await user.click(screen.getByText(STATUS_CODE, { exact: false }));

    await user.click(screen.getByLabelText(`Valid HTTP versions`, { exact: false }));
    await user.click(screen.getByText(HTTP_VERSION, { selector: `span` }));

    const selectMenus = await within(validationSection).findByTestId(DataTestIds.CHECK_FORM_HTTP_VALIDATION_REGEX);
    const matchSelect1 = within(selectMenus).getByTestId(`http-validation-match-type-0`);
    await user.click(matchSelect1);
    await user.click(screen.getByText('Header', { selector: `span` }));

    await user.clear(await within(validationSection).getAllByPlaceholderText('Header name')[0]);
    await user.type(await within(validationSection).getAllByPlaceholderText('Header name')[0], HEADER_NAME);

    await user.clear(await within(validationSection).getAllByPlaceholderText('Regex')[0]);
    await user.type(await within(validationSection).getAllByPlaceholderText('Regex')[0], REGEX);

    const matchSelect2 = within(selectMenus).getByTestId(`http-validation-match-type-1`);
    await user.click(matchSelect2);
    await user.click(screen.getByText('Body', { selector: `span` }));

    const regexFields = await within(validationSection).getAllByPlaceholderText('Regex');
    await user.clear(regexFields[1]);
    await user.type(regexFields[1], BODY_REGEX);

    const [allowMissing, invertMatch] = await within(validationSection).findAllByRole('checkbox');
    await user.click(allowMissing);
    await user.click(invertMatch);

    await submitForm(user);

    const { body } = await read();

    expect(body).toEqual({
      ...targetCheck,
      job: `${targetCheck.job}${JOB_SUFFIX}`,
      probes: [UNSELECTED_PRIVATE_PROBE.id],
      tenantId: undefined,
      settings: {
        http: {
          ...targetCheck.settings.http,
          basicAuth: {
            username: USERNAME,
            password: PASSWORD,
          },
          bearerToken: BEARER_TOKEN,
          body: BODY,
          compression: COMPRESSION,
          headers: [...targetCheck.settings.http?.headers!, `${NEW_HEADER.name}:${NEW_HEADER.value}`],
          proxyURL: PROXY_URL,
          tlsConfig: {
            ...targetCheck.settings.http?.tlsConfig,
            serverName: `${targetCheck.settings.http?.tlsConfig?.serverName}${SERVER_NAME_SUFFIX}`,
            caCert: btoa(validCert),
            clientCert: btoa(validCert),
            clientKey: btoa(validKey),
          },
          validStatusCodes: [STATUS_CODE],
          validHTTPVersions: [HTTP_VERSION],
          failIfBodyMatchesRegexp: [BODY_REGEX],
          failIfBodyNotMatchesRegexp: [REGEX, targetCheck.settings.http?.failIfHeaderNotMatchesRegexp?.[0]?.regexp],
          failIfHeaderMatchesRegexp: [
            {
              ...targetCheck.settings.http?.failIfHeaderMatchesRegexp![0],
              header: HEADER_NAME,
            },
          ],
          failIfHeaderNotMatchesRegexp: [],
        },
      },
    });
  });

  // it('transforms data correctly for TCP check', async () => {
  //   const { read, record } = getServerRequests();
  //   server.use(apiRoute(`updateCheck`, {}, record));
  //   const { user } = await renderExistingCheckEditor(`/edit/${BASIC_TCP_CHECK.id}`);

  //   await submitForm(user);
  //   const { body } = await read();
  //   expect(body).toEqual(BASIC_TCP_CHECK);
  // });

  // it('transforms data correctly for DNS check', async () => {
  //   const { read, record } = getServerRequests();
  //   server.use(apiRoute(`updateCheck`, {}, record));
  //   const NOT_INVERTED_VALIDATION = 'not inverted validation';
  //   const INVERTED_VALIDATION = 'inverted validation';

  //   const { user } = await renderExistingCheckEditor(`/edit/${BASIC_DNS_CHECK.id}`);
  //   await toggleSection('Validation', user);

  //   const responseMatch1 = await screen.findByTestId('dnsValidationResponseMatch0');
  //   await user.selectOptions(responseMatch1, DNS_RESPONSE_MATCH_OPTIONS[1].value);
  //   const responseMatch2 = await screen.findByTestId('dnsValidationResponseMatch1');
  //   await user.selectOptions(responseMatch2, DNS_RESPONSE_MATCH_OPTIONS[1].value);

  //   const expressionInputs = await screen.findAllByPlaceholderText('Type expression');
  //   await user.clear(expressionInputs[0]);
  //   await user.clear(expressionInputs[1]);
  //   await user.type(expressionInputs[0], NOT_INVERTED_VALIDATION);
  //   await user.type(expressionInputs[1], INVERTED_VALIDATION);
  //   const invertedCheckboxes = await screen.findAllByRole('checkbox');
  //   await user.click(invertedCheckboxes[2]);
  //   await submitForm(user);

  //   const { body } = await read();

  //   expect(body).toEqual({
  //     ...BASIC_DNS_CHECK,
  //     tenantId: undefined,
  //     settings: {
  //       dns: {
  //         ...BASIC_DNS_CHECK.settings.dns,
  //         validateAnswerRRS: {
  //           ...BASIC_DNS_CHECK.settings.dns.validateAnswerRRS,
  //           failIfNotMatchesRegexp: [NOT_INVERTED_VALIDATION, INVERTED_VALIDATION],
  //         },
  //         validateAuthorityRRS: {
  //           failIfMatchesRegexp: [],
  //           failIfNotMatchesRegexp: [],
  //         },
  //       },
  //     },
  //   });
  // });

  // it('handles custom alert severities', async () => {
  //   const { user } = await renderExistingCheckEditor(`/edit/${CUSTOM_ALERT_SENSITIVITY_CHECK.id}`);
  //   await toggleSection('Alerting', user);

  //   const alertSensitivityInput = await screen.findByTestId('alertSensitivityInput');
  //   expect(alertSensitivityInput).toHaveValue(CUSTOM_ALERT_SENSITIVITY_CHECK.alertSensitivity);
  // });
});
