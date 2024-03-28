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
import { CheckForm } from 'components/CheckForm/CheckForm';
import { DNS_RESPONSE_MATCH_OPTIONS, PLUGIN_URL_PATH } from 'components/constants';

import { getSelect, getSlider, submitForm, toggleSection } from './testHelpers';

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
  const res = render(<CheckForm />, {
    route: `${PLUGIN_URL_PATH}${ROUTES.Checks}/edit/:checkType/:id`,
    path: `${PLUGIN_URL_PATH}${ROUTES.Checks}${route}`,
  });

  await waitFor(() => expect(screen.getAllByText(`Job name`, { exact: false })));

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
    } = settings.http;
    const [headerName, headerValue] = headers![0].split(`:`);

    const { user } = await renderExistingCheckEditor(`/edit/http/${targetCheck.id}`);
    expect(await screen.findByLabelText('Job name', { exact: false })).toHaveValue(targetCheck.job);
    expect(await screen.findByLabelText('Enabled', { exact: false })).toBeChecked();
    expect(await screen.findByLabelText('Full URL to send requests to', { exact: false })).toHaveValue(
      targetCheck.target
    );
    expect(await screen.findByText(PRIVATE_PROBE.name)).toBeInTheDocument();
    const [frequencyMinutes, frequencySeconds] = await getSlider('frequency');
    expect(frequencyMinutes).toHaveValue(Math.floor(targetCheck.frequency / 1000 / 60).toString());
    expect(frequencySeconds).toHaveValue(((targetCheck.frequency / 1000) % 60).toString());

    const [timeoutMinutes, timeoutSeconds] = await getSlider('timeout');
    expect(timeoutMinutes).toHaveValue(Math.floor(targetCheck.timeout / 1000 / 60).toString());
    expect(timeoutSeconds).toHaveValue(((targetCheck.timeout / 1000) % 60).toString());

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
    expect(await screen.findByLabelText('Username')).toHaveValue(basicAuth?.username);
    expect(await screen.findByLabelText('Password')).toHaveValue(basicAuth?.password);

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

  it(`transforms data correctly http check -- job`, async () => {
    const { read, record } = getServerRequests();
    server.use(apiRoute(`updateCheck`, {}, record));
    const targetCheck = FULL_HTTP_CHECK;
    const { user } = await renderExistingCheckEditor(`/edit/http/${targetCheck.id}`);

    const JOB_SUFFIX = 'tacos';
    const jobInput = await screen.findByLabelText(`Job name`, { exact: false });
    await user.type(jobInput, JOB_SUFFIX);

    await submitForm(user);
    const { body } = await read();

    expect(body).toEqual({
      ...targetCheck,
      job: `${targetCheck.job}${JOB_SUFFIX}`,
    });
  });

  it(`transforms data correctly http check -- probe section`, async () => {
    const { read, record } = getServerRequests();
    server.use(apiRoute(`updateCheck`, {}, record));
    const targetCheck = FULL_HTTP_CHECK;
    const { user } = await renderExistingCheckEditor(`/edit/http/${targetCheck.id}`);

    await user.click(screen.getByText(`Clear`));
    const probeOptions = screen.getByText('Probe options').parentElement;
    const probeSelectMenu = await within(probeOptions!).getByLabelText('Probe locations', { exact: false });
    await user.click(probeSelectMenu);
    await user.click(screen.getByText(UNSELECTED_PRIVATE_PROBE.name, { exact: false }));

    await submitForm(user);
    const { body } = await read();

    expect(body).toEqual({
      ...targetCheck,
      probes: [UNSELECTED_PRIVATE_PROBE.id],
    });
  });

  it(`transforms data correctly http check -- http section`, async () => {
    const { read, record } = getServerRequests();
    server.use(apiRoute(`updateCheck`, {}, record));
    const targetCheck = FULL_HTTP_CHECK;
    const { user } = await renderExistingCheckEditor(`/edit/http/${targetCheck.id}`);

    const BODY = 'a body';
    const NEW_HEADER = {
      name: 'new headerName',
      value: 'new headerValue',
    };
    const COMPRESSION = 'deflate';
    const PROXY_URL = 'http://proxy.url';

    await toggleSection('HTTP settings', user);
    const requestBodyInput = await screen.findByLabelText('Request Body', { exact: false });
    requestBodyInput.focus();
    await user.clear(requestBodyInput);
    await user.paste(BODY);
    await user.click(await screen.findByRole('button', { name: 'Add request header' }));

    await user.type(await screen.findByLabelText('Request header 2 name'), NEW_HEADER.name);
    await user.type(await screen.findByLabelText('Request header 2 value'), NEW_HEADER.value);

    const compression = await screen.getByLabelText('Compression option', { exact: false });
    await user.click(compression);
    await user.click(screen.getByText(COMPRESSION, { exact: false }));

    const proxyUrlInput = await screen.findByLabelText('Proxy URL', { exact: false });
    proxyUrlInput.focus();
    await user.clear(proxyUrlInput);
    await user.paste(PROXY_URL);

    await submitForm(user);
    const { body } = await read();

    expect(body).toEqual({
      ...targetCheck,
      settings: {
        http: {
          ...targetCheck.settings.http,
          body: BODY,
          compression: COMPRESSION,
          headers: [...targetCheck.settings.http.headers!, `${NEW_HEADER.name}:${NEW_HEADER.value}`],
          proxyURL: PROXY_URL,
        },
      },
    });
  });

  it(`transforms data correctly http check -- validation section`, async () => {
    const { read, record } = getServerRequests();
    server.use(apiRoute(`updateCheck`, {}, record));
    const targetCheck = FULL_HTTP_CHECK;
    const { user } = await renderExistingCheckEditor(`/edit/http/${targetCheck.id}`);

    const STATUS_CODE = 100;
    const HTTP_VERSION = 'HTTP/1.1';
    const HEADER_NAME = 'a new header name';
    const REGEX = 'a regex';
    const BODY_REGEX = 'a body regex';

    const validationSection = await toggleSection('Validation', user);

    await user.click(screen.getByLabelText(`Valid status codes`, { exact: false }));
    await user.click(screen.getByText(STATUS_CODE, { exact: false }));

    const [selectContainer, select] = await getSelect({ text: `Valid HTTP versions` });
    await user.click(within(selectContainer).getByLabelText(`Remove`));
    await user.click(select);
    await user.click(screen.getByText(HTTP_VERSION, { selector: `span` }));

    const selectMenus = await within(validationSection).findByTestId(DataTestIds.CHECK_FORM_HTTP_VALIDATION_REGEX);
    const matchSelect1 = within(selectMenus).getByLabelText(`Validation Field Name 1`);
    await user.click(matchSelect1);
    await user.click(screen.getByText('Check fails if response header matches', { selector: `span` }));

    await user.clear(await within(validationSection).getAllByPlaceholderText('Header name')[0]);
    await user.type(await within(validationSection).getAllByPlaceholderText('Header name')[0], HEADER_NAME);

    await user.clear(await within(validationSection).getAllByPlaceholderText('Regex')[0]);
    await user.type(await within(validationSection).getAllByPlaceholderText('Regex')[0], REGEX);

    const matchSelect2 = within(selectMenus).getByLabelText(`Validation Field Name 2`);
    await user.click(matchSelect2);
    await user.click(screen.getByText('Check fails if response body matches', { selector: `span` }));

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
      settings: {
        http: {
          ...targetCheck.settings.http,
          failIfBodyMatchesRegexp: [],
          failIfBodyNotMatchesRegexp: [BODY_REGEX],
          failIfHeaderNotMatchesRegexp: [
            {
              ...targetCheck.settings.http?.failIfHeaderMatchesRegexp![0],
              header: HEADER_NAME,
              regexp: REGEX,
            },
            {
              ...targetCheck.settings.http?.failIfHeaderNotMatchesRegexp![0],
            },
          ],
          validHTTPVersions: [HTTP_VERSION],
        },
      },
    });
  });

  it('transforms data correctly for TCP check', async () => {
    const { read, record } = getServerRequests();
    server.use(apiRoute(`updateCheck`, {}, record));
    const { user } = await renderExistingCheckEditor(`/edit/tcp/${BASIC_TCP_CHECK.id}`);

    await submitForm(user);
    const { body } = await read();
    expect(body).toEqual(BASIC_TCP_CHECK);
  });

  it('transforms data correctly for DNS check', async () => {
    const { read, record } = getServerRequests();
    server.use(apiRoute(`updateCheck`, {}, record));
    const NOT_INVERTED_VALIDATION = 'not inverted validation';
    const INVERTED_VALIDATION = 'inverted validation';

    const { user } = await renderExistingCheckEditor(`/edit/dns/${BASIC_DNS_CHECK.id}`);
    await toggleSection('Validation', user);

    const responseMatch1 = await screen.findByLabelText('DNS Response Match 1');
    await user.click(responseMatch1);
    await user.click(screen.getByText(DNS_RESPONSE_MATCH_OPTIONS[1].label));

    const responseMatch2 = await screen.findByLabelText('DNS Response Match 2');
    await user.click(responseMatch2);
    await user.click(screen.getByText(DNS_RESPONSE_MATCH_OPTIONS[1].label, { selector: `span` }));

    const expressionInputs = await screen.findAllByPlaceholderText('Type expression');
    await user.clear(expressionInputs[0]);
    await user.clear(expressionInputs[1]);
    await user.type(expressionInputs[0], NOT_INVERTED_VALIDATION);
    await user.type(expressionInputs[1], INVERTED_VALIDATION);
    const invertedCheckboxes = await screen.findAllByRole('checkbox');
    await user.click(invertedCheckboxes[2]);
    await submitForm(user);

    const { body } = await read();

    expect(body).toEqual({
      ...BASIC_DNS_CHECK,
      tenantId: undefined,
      settings: {
        dns: {
          ...BASIC_DNS_CHECK.settings.dns,
          validateAnswerRRS: {
            ...BASIC_DNS_CHECK.settings.dns.validateAnswerRRS,
            failIfNotMatchesRegexp: [NOT_INVERTED_VALIDATION, INVERTED_VALIDATION],
          },
          validateAuthorityRRS: {
            failIfMatchesRegexp: [],
            failIfNotMatchesRegexp: [],
          },
        },
      },
    });
  });

  it('handles custom alert severities', async () => {
    const { user } = await renderExistingCheckEditor(`/edit/dns/${CUSTOM_ALERT_SENSITIVITY_CHECK.id}`);
    await toggleSection('Alerting', user);

    const alertSensitivityInput = await screen.findByText(CUSTOM_ALERT_SENSITIVITY_CHECK.alertSensitivity);
    expect(alertSensitivityInput).toBeInTheDocument();
  });
});
