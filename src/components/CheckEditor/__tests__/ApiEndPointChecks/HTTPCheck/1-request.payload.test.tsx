import { screen } from '@testing-library/react';
import { VALID_CERT, VALID_KEY } from 'test/fixtures/checks';
import { selectOption } from 'test/utils';

import { CheckType, HttpMethod, IpVersion } from 'types';
import { goToSection, renderNewForm, submitForm } from 'components/CheckEditor/__testHelpers__/checkForm';

import { fillMandatoryFields } from '../../../__testHelpers__/apiEndPoint';

const checkType = CheckType.HTTP;

describe(`HttpCheck - Section 1 (Request) payload`, () => {
  it(`has the correct default values submitted`, async () => {
    const { read, user } = await renderNewForm(checkType);

    await fillMandatoryFields({ user, checkType });
    await submitForm(user);

    const { body } = await read();
    expect(body.settings.http.ipVersion).toBe(IpVersion.V4);
  });

  it(`can change method to POST`, async () => {
    const METHOD_OPTION = HttpMethod.POST;
    const { read, user } = await renderNewForm(checkType);
    await selectOption(user, { label: 'Request method', option: METHOD_OPTION });

    await fillMandatoryFields({ user, checkType });
    await submitForm(user);

    const { body } = await read();
    expect(body.settings.http.method).toBe(METHOD_OPTION);
  });

  it(`can add request target`, async () => {
    const REQUEST_TARGET = `https://example.com`;

    const { read, user } = await renderNewForm(checkType);
    const targetInput = await screen.findByLabelText('Request target', { exact: false });
    await user.type(targetInput, REQUEST_TARGET);

    await fillMandatoryFields({ user, fieldsToOmit: [`target`], checkType });
    await submitForm(user);

    const { body } = await read();
    expect(body.target).toBe(REQUEST_TARGET);
  });

  it(`can add query parameters`, async () => {
    const REQUEST_TARGET = `https://example.com/`;
    const QUERY_PARAM_KEY_1 = `key1`;
    const QUERY_PARAM_VALUE_1 = `value1`;
    const QUERY_PARAM_KEY_2 = `key2`;
    const QUERY_PARAM_VALUE_2 = `value2`;

    const { read, user } = await renderNewForm(checkType);

    const targetInput = await screen.findByLabelText('Request target', { exact: false });
    await user.type(targetInput, REQUEST_TARGET);

    const queryParamsButton = await screen.findByLabelText('Manage query parameters');
    await user.click(queryParamsButton);

    const queryParam1Key = await screen.findByLabelText('Query param key 1');
    const queryParam1Value = await screen.findByLabelText('Query param value 1');

    await user.type(queryParam1Key, QUERY_PARAM_KEY_1);
    await user.type(queryParam1Value, QUERY_PARAM_VALUE_1);

    const addQueryParamButton = await screen.findByText('Add query param');
    await user.click(addQueryParamButton);

    const queryParam2Key = await screen.findByLabelText('Query param key 2');
    const queryParam2Value = await screen.findByLabelText('Query param value 2');

    await user.type(queryParam2Key, QUERY_PARAM_KEY_2);
    await user.type(queryParam2Value, QUERY_PARAM_VALUE_2);

    await fillMandatoryFields({ user, fieldsToOmit: [`target`], checkType });
    await submitForm(user);

    const { body } = await read();
    expect(body.target).toBe(
      `${REQUEST_TARGET}?${QUERY_PARAM_KEY_1}=${QUERY_PARAM_VALUE_1}&${QUERY_PARAM_KEY_2}=${QUERY_PARAM_VALUE_2}`
    );
  });

  it(`can add a cache busting query parameter`, async () => {
    const CACHE_BUSTER_PARAM = `ghost-busting`;

    const { read, user } = await renderNewForm(checkType);
    await fillMandatoryFields({ user, checkType });
    await goToSection(user, 1);

    const queryParamsButton = screen.getByLabelText('Manage query parameters');
    await user.click(queryParamsButton);

    const cacheBustingCheckbox = screen.getByPlaceholderText('cache-bust');
    await user.type(cacheBustingCheckbox, CACHE_BUSTER_PARAM);

    await submitForm(user);
    const { body } = await read();
    expect(body.settings.http.cacheBustingQueryParamName).toBe(CACHE_BUSTER_PARAM);
  });

  describe(`Request options`, () => {
    it(`can add request headers`, async () => {
      const HEADER_KEY_1 = `header-key-1`;
      const HEADER_VALUE_1 = `header-value-1`;
      const HEADER_KEY_2 = `header-key-2`;
      const HEADER_VALUE_2 = `header-value-2`;

      const { read, user } = await renderNewForm(checkType);

      await user.click(screen.getByText('Request options'));
      const addRequestHeaderButton = screen.getByText(`Add request header`, { exact: false });
      await user.click(addRequestHeaderButton);

      const headerKeyInput = await screen.findByLabelText('Request header 1 name');
      const headerValueInput = await screen.findByLabelText('Request header 1 value');

      await user.type(headerKeyInput, HEADER_KEY_1);
      await user.type(headerValueInput, HEADER_VALUE_1);
      await user.click(addRequestHeaderButton);

      const headerKeyInput2 = await screen.findByLabelText('Request header 2 name');
      const headerValueInput2 = await screen.findByLabelText('Request header 2 value');

      await user.type(headerKeyInput2, HEADER_KEY_2);
      await user.type(headerValueInput2, HEADER_VALUE_2);

      await fillMandatoryFields({ user, checkType });
      await submitForm(user);

      const { body } = await read();
      expect(body.settings.http.headers).toEqual([
        `${HEADER_KEY_1}:${HEADER_VALUE_1}`,
        `${HEADER_KEY_2}:${HEADER_VALUE_2}`,
      ]);
    });

    it(`can submit the IP version`, async () => {
      const IP_VERSION = IpVersion.V6;

      const { read, user } = await renderNewForm(checkType);
      await user.click(screen.getByText('Request options'));
      await selectOption(user, { label: 'IP version', option: IP_VERSION });

      await fillMandatoryFields({ user, checkType });
      await submitForm(user);

      const { body } = await read();
      expect(body.settings.http.ipVersion).toBe(IP_VERSION);
    });
  });

  describe(`Request body`, () => {
    it(`can add request body`, async () => {
      const REQUEST_BODY = `simple body text`;

      const { read, user } = await renderNewForm(checkType);
      await user.click(screen.getByText('Request options'));
      await user.click(screen.getByText('Request Body'));
      await user.type(screen.getByLabelText('Request body', { selector: `textarea` }), REQUEST_BODY);
      await fillMandatoryFields({ user, checkType });
      await submitForm(user);

      const { body } = await read();
      expect(body.settings.http.body).toBe(REQUEST_BODY);
    });
  });

  describe(`Basic auth`, () => {
    it(`can add bearer token`, async () => {
      const BEARER_TOKEN = `a lovely bear`;

      const { read, user } = await renderNewForm(checkType);
      await user.click(screen.getByText('Request options'));
      await user.click(screen.getByText('Authentication'));
      await user.click(screen.getByLabelText('Bearer'));
      await user.type(screen.getByLabelText('Bearer Authorization', { exact: false }), BEARER_TOKEN);
      await fillMandatoryFields({ user, checkType });
      await submitForm(user);

      const { body } = await read();
      expect(body.settings.http.bearerToken).toBe(BEARER_TOKEN);
    });

    it(`can add basic auth`, async () => {
      const USERNAME = `the user`;
      const PASSWORD = `the password`;

      const { read, user } = await renderNewForm(checkType);
      await user.click(screen.getByText('Request options'));
      await user.click(screen.getByText('Authentication'));
      await user.click(screen.getByLabelText('Basic'));
      await user.type(screen.getByLabelText('Username *'), USERNAME);
      await user.type(screen.getByLabelText('Password *'), PASSWORD);

      await fillMandatoryFields({ user, checkType });
      await submitForm(user);

      const { body } = await read();
      expect(body.settings.http.basicAuth).toStrictEqual({
        username: USERNAME,
        password: PASSWORD,
      });
    });
  });

  describe(`TLS Config`, () => {
    it(`can disable target certificate validation`, async () => {
      const { read, user } = await renderNewForm(checkType);
      await user.click(screen.getByText('Request options'));
      await user.click(screen.getByText('TLS Config'));

      await user.click(screen.getByLabelText('Disable target certificate validation'));
      await fillMandatoryFields({ user, checkType });
      await submitForm(user);

      const { body } = await read();
      expect(body.settings.http.tlsConfig.insecureSkipVerify).toBe(true);
    });

    it(`can add server name`, async () => {
      const SERVER_NAME = `server.com`;

      const { read, user } = await renderNewForm(checkType);
      await user.click(screen.getByText('Request options'));
      await user.click(screen.getByText('TLS Config'));

      await user.type(screen.getByLabelText('Server name', { exact: false }), SERVER_NAME);
      await fillMandatoryFields({ user, checkType });
      await submitForm(user);

      const { body } = await read();
      expect(body.settings.http.tlsConfig.serverName).toBe(SERVER_NAME);
    });

    it(`can add CA certificate`, async () => {
      const { read, user } = await renderNewForm(checkType);
      await user.click(screen.getByText('Request options'));
      await user.click(screen.getByText('TLS Config'));
      await user.type(screen.getByLabelText('CA certificate', { exact: false }), VALID_CERT);
      await fillMandatoryFields({ user, checkType });
      await submitForm(user);

      const { body } = await read();
      expect(body.settings.http.tlsConfig.caCert).toBe(btoa(VALID_CERT));
    });

    it(`can add Client certificate`, async () => {
      const { read, user } = await renderNewForm(checkType);
      await user.click(screen.getByText('Request options'));
      await user.click(screen.getByText('TLS Config'));
      await user.type(screen.getByLabelText('Client certificate', { exact: false }), VALID_CERT);
      await fillMandatoryFields({ user, checkType });
      await submitForm(user);

      const { body } = await read();
      expect(body.settings.http.tlsConfig.clientCert).toBe(btoa(VALID_CERT));
    });

    it(`can add Client key`, async () => {
      const { read, user } = await renderNewForm(checkType);
      await user.click(screen.getByText('Request options'));
      await user.click(screen.getByText('TLS Config'));
      await user.type(screen.getByLabelText('Client key', { exact: false }), VALID_KEY);
      await fillMandatoryFields({ user, checkType });
      await submitForm(user);

      const { body } = await read();
      expect(body.settings.http.tlsConfig.clientKey).toBe(btoa(VALID_KEY));
    });
  });

  describe(`Proxy`, () => {
    it(`can add proxy URL`, async () => {
      const PROXY_URL = `https://proxy.com`;

      const { read, user } = await renderNewForm(checkType);
      await user.click(screen.getByText('Request options'));
      await user.click(screen.getByText('Proxy'));
      await user.type(screen.getByLabelText('Proxy URL', { exact: false }), PROXY_URL);
      await fillMandatoryFields({ user, checkType });
      await submitForm(user);

      const { body } = await read();
      expect(body.settings.http.proxyURL).toBe(PROXY_URL);
    });

    it(`can add proxy headers`, async () => {
      const PROXY_HEADER_KEY_1 = `proxy-header-key-1`;
      const PROXY_HEADER_VALUE_1 = `proxy-header-value-1`;
      const PROXY_HEADER_KEY_2 = `proxy-header-key-2`;
      const PROXY_HEADER_VALUE_2 = `proxy-header-value-2`;

      const { read, user } = await renderNewForm(checkType);
      await user.click(screen.getByText('Request options'));
      await user.click(screen.getByText('Proxy'));
      const addRequestHeaderButton = screen.getByText(`Add proxy connect header`, { exact: false });
      await user.click(addRequestHeaderButton);

      const headerKeyInput = await screen.findByLabelText('Proxy connect header 1 name');
      const headerValueInput = await screen.findByLabelText('Proxy connect header 1 value');

      await user.type(headerKeyInput, PROXY_HEADER_KEY_1);
      await user.type(headerValueInput, PROXY_HEADER_VALUE_1);
      await user.click(addRequestHeaderButton);

      const headerKeyInput2 = await screen.findByLabelText('Proxy connect header 2 name');
      const headerValueInput2 = await screen.findByLabelText('Proxy connect header 2 value');

      await user.type(headerKeyInput2, PROXY_HEADER_KEY_2);
      await user.type(headerValueInput2, PROXY_HEADER_VALUE_2);

      await fillMandatoryFields({ user, checkType });
      await submitForm(user);

      const { body } = await read();
      expect(body.settings.http.proxyConnectHeaders).toEqual([
        `${PROXY_HEADER_KEY_1}:${PROXY_HEADER_VALUE_1}`,
        `${PROXY_HEADER_KEY_2}:${PROXY_HEADER_VALUE_2}`,
      ]);
    });
  });
});
