import React from 'react';
import { render, screen, waitFor, act, within } from '@testing-library/react';
import {
  Check,
  IpVersion,
  CheckType,
  DnsResponseCodes,
  ResponseMatchType,
  HttpMethod,
  HttpVersion,
  GlobalSettings,
  AlertSensitivity,
} from 'types';
import { CheckEditor } from './CheckEditor';
import { getInstanceMock } from '../../datasource/__mocks__/DataSource';
import userEvent from '@testing-library/user-event';
import { InstanceContext } from 'components/InstanceContext';
import { AppPluginMeta, DataSourceSettings } from '@grafana/data';
jest.setTimeout(60000);

// Mock useAlerts hook
const setRulesForCheck = jest.fn();
const deleteRulesForCheck = jest.fn();
jest.mock('hooks/useAlerts', () => ({
  useAlerts: () => ({
    alertRules: [],
    setRulesForCheck,
    deleteRulesForCheck,
  }),
}));

const validCert = `-----BEGIN CERTIFICATE-----
MIICUTCCAfugAwIBAgIBADANBgkqhkiG9w0BAQQFADBXMQswCQYDVQQGEwJDTjEL
MAkGA1UECBMCUE4xCzAJBgNVBAcTAkNOMQswCQYDVQQKEwJPTjELMAkGA1UECxMC
VU4xFDASBgNVBAMTC0hlcm9uZyBZYW5nMB4XDTA1MDcxNTIxMTk0N1oXDTA1MDgx
NDIxMTk0N1owVzELMAkGA1UEBhMCQ04xCzAJBgNVBAgTAlBOMQswCQYDVQQHEwJD
TjELMAkGA1UEChMCT04xCzAJBgNVBAsTAlVOMRQwEgYDVQQDEwtIZXJvbmcgWWFu
ZzBcMA0GCSqGSIb3DQEBAQUAA0sAMEgCQQCp5hnG7ogBhtlynpOS21cBewKE/B7j
V14qeyslnr26xZUsSVko36ZnhiaO/zbMOoRcKK9vEcgMtcLFuQTWDl3RAgMBAAGj
gbEwga4wHQYDVR0OBBYEFFXI70krXeQDxZgbaCQoR4jUDncEMH8GA1UdIwR4MHaA
FFXI70krXeQDxZgbaCQoR4jUDncEoVukWTBXMQswCQYDVQQGEwJDTjELMAkGA1UE
CBMCUE4xCzAJBgNVBAcTAkNOMQswCQYDVQQKEwJPTjELMAkGA1UECxMCVU4xFDAS
BgNVBAMTC0hlcm9uZyBZYW5nggEAMAwGA1UdEwQFMAMBAf8wDQYJKoZIhvcNAQEE
BQADQQA/ugzBrjjK9jcWnDVfGHlk3icNRq0oV7Ri32z/+HQX67aRfgZu7KWdI+Ju
Wm7DCfrPNGVwFWUQOmsPue9rZBgO
-----END CERTIFICATE-----`;

const validKey = `-----BEGIN RSA PRIVATE KEY-----
Proc-Type: 4,ENCRYPTED
DEK-Info: DES-EDE3-CBC,F57524B7B26F4694

IJ/e6Xrf4pTBSO+CHdcqGocyAj5ysUre5BwTp6Yk2w9P/r7si7YA+pivghbUzYKc
uy2hFwWG+LVajZXaG0dFXmbDHd9oYlW/SeJhPrxMvxaqC9R/x4MugAMFOhCQGMq3
XW58R70L48BIuG6TCSOAGIwMDowv5ToL4nZYnqIRT77aACcsM0ozC+LCyqmLvvsU
NV/YX4ZgMhzaT2eVK+mtOut6m1Wb7t6iUCS14dB/fTF+RaGYYZYMGut/alFaPqj0
/KKlTNxCRD99+UZDbg3TnxIFSZd00zY75votTZnlLypoB9pUFP5iQglvuQ4pD3Ux
bzU4cO0/hrdo04wORwWG/DUoAPlq8wjGei5jbEwHQJ8fNBzCl3Zy5Fx3bcAaaXEK
zB97cyqhr80f2KnyiAKzk7vmyuRtMO/6Y4yE+1mLFE7NWcRkGXLEd3+wEt8DEq2R
nQibvRTbT26HkO0bcfBAaeOYxHawdNcF2SZ1dUSZeo/teHNBI2JD5xRgtEPekXRs
bBuCmxUevuh2+Q632oOpNNpFWBJTsyTcp9cAsxTEkbOCicxLN6c1+GvwyIqfSykR
G08Y5M88n7Ey5GZ43KUbGh60vV5QN/mzhf3SotBl9+wetpm+4AmkKVUQyQVdRrn2
1jXrkUZcSN8VbYk2tB74/FFXuaaF2WRQNawceXjrvegxz3/AkjZ7ahYI4rgptCqz
OXvMk+le5tmVKbJfl1G+EZm2CqDLly5makeMKvX3fSWefKoZSbN0NuW28RgSJIQC
pqja3dWZyGl7Z9dlM+big0nbLhMdIvT8526lD+p+9aMMuBL14MhWGp4IIfvXOPR+
Ots3ZoGR9vtPQyO6YN5/CtRp1DBbRA48W9xk0BnnjSNpFBLY4ykqZj/cS01Up88x
UMATqoMLiBwKCyaeibiIXpzqPTagG3PEEJkYPsrG/zql1EktjTtNo4LaYdFuZZzb
fMmcEpFZLerCIgu2cOnhhKwCHYWbZ2MSVsgoiu6RyqqBblAfNkttthiPtCLY82sQ
2ejN3NMsq+xlc/ISc21eClUaoUXmvyaSf2E3D4CN3FAi8fD74fP64EiKr+JjMNUC
DWZ79UdwZcpl2VJ7JUAAyRzEt66U5PwQqv1U8ITjsBjykxRQ68/c/+HCOfg9NYn3
cmpK5UxdFGj6261c6nVRlLVmV0+mPj1+sWHow5jZiH81IuoL3zqGkKzqy5FkTgs4
MG3hViN9lHEmMPZdK16EPhCwvff0eBV+vhfPjmGoAE6TK3YY/yh9bfhMliLoc1jr
NmPxL0FWrNzqWxZwMtDYcXu4KUesBL6/Hr+K9HSUa8zF+4UbELJTPOd1QAU6HF7a
9BidzGMZ+J2Vjqa/NGpWckBRjWb6S7aItK6rrtORU1QHmpQlYpqEh49sreo6DCrb
s8yejjKm2gSB/KhTe1nJXcTM16Xa4qWXTv11x46FNTZPUWQ7KoI0AzzScn6StBdo
YCvzqCrla1em/Kakkws7Qu/pVj9R8ndHzoLktOi3l6lwwy5d4L697DyhP+02+eLt
SBefoVnBNp449CSHW+brvPEyKD3D5CVpTIDfu2y8+nHszfBL22wuO4T+oem5h55A
-----END RSA PRIVATE KEY-----`;

const transformedValidCert = btoa(validCert);
const transformedValidKey = btoa(validKey);

// Data mocks

const defaultCheck = {
  job: '',
  alertSensitivity: 'none',
  target: '',
  frequency: 60000,
  timeout: 3000,
  enabled: true,
  labels: [],
  probes: [],
  settings: {
    ping: {
      ipVersion: IpVersion.V4,
      dontFragment: false,
    },
  },
  basicMetricsOnly: false,
} as Check;

const getMinimumCheck = (overrides: Partial<Check> = {}) => ({
  ...defaultCheck,
  job: 'tacos',
  target: 'burritos.com',
  probes: [1],
  ...overrides,
});

const onReturn = jest.fn();

beforeEach(() => jest.resetAllMocks());

// Selectors

const selectCheckType = async (checkType: CheckType) => {
  const checkTypeInput = await screen.findByText('PING');
  userEvent.click(checkTypeInput);
  const selectMenus = await screen.findAllByTestId('select');
  userEvent.selectOptions(selectMenus[0], checkType);
  await screen.findByText(checkType.toUpperCase());
};

const selectDnsResponseMatchType = async (container: HTMLElement, responseMatch: ResponseMatchType) => {
  const selectMenus = await within(container).findAllByTestId('select');
  // const responseMatchInput = selectMenus.find('Validate Authority matches')
  // userEvent.click(responseMatchInput);
  userEvent.selectOptions(selectMenus[selectMenus.length - 1], [responseMatch]);
  // const options = await screen.findAllByText(`Validate ${responseMatch} matches`);
  // userEvent.click(options[options.length - 1]);
};

const toggleSection = async (sectionName: string): Promise<HTMLElement> => {
  const sectionHeader = await screen.findByText(sectionName);
  userEvent.click(sectionHeader);
  return sectionHeader.parentElement?.parentElement ?? new HTMLElement();
};

const submitForm = async () => {
  const saveButton = await screen.findByRole('button', { name: 'Save' });
  expect(saveButton).not.toBeDisabled();
  userEvent.click(saveButton);
  await waitFor(() => expect(onReturn).toHaveBeenCalledWith(true));
};

const getSlider = async (formName: string) => {
  const container = await screen.findByTestId(formName);
  const input = (await within(container).findByRole('textbox')) as HTMLInputElement;
  return input;
};

// Test Renderer
const renderCheckEditor = async ({ check = defaultCheck, withAlerting = true } = {}) => {
  const api = getInstanceMock();
  const instance = {
    api,
    alertRuler: withAlerting ? ({} as DataSourceSettings) : undefined,
  };
  const meta = {} as AppPluginMeta<GlobalSettings>;
  render(
    <InstanceContext.Provider value={{ instance, loading: false, meta }}>
      <CheckEditor check={check} onReturn={onReturn} />
    </InstanceContext.Provider>
  );
  await waitFor(() => expect(screen.getByText('Check Details')).toBeInTheDocument());
  return instance;
};

it('Updates existing check', async () => {
  const instance = await renderCheckEditor({ check: getMinimumCheck({ target: 'grafana.com', id: 32, tenantId: 45 }) });
  await submitForm();
  expect(instance.api.addCheck).toHaveBeenCalledTimes(0);
  expect(instance.api.updateCheck).toHaveBeenCalledWith({
    job: 'tacos',
    id: 32,
    tenantId: 45,
    alertSensitivity: 'none',
    target: 'grafana.com',
    enabled: true,
    labels: [],
    probes: [1],
    timeout: 3000,
    frequency: 60000,
    basicMetricsOnly: false,
    settings: {
      ping: {
        ipVersion: 'V4',
        dontFragment: false,
      },
    },
  });
});

describe('PING', () => {
  it('transforms values to correct format', async () => {
    const instance = await renderCheckEditor({ check: getMinimumCheck({ target: 'grafana.com' }) });
    await toggleSection('Advanced options');
    const addLabel = await screen.findByRole('button', { name: 'Add label' });
    userEvent.click(addLabel);
    const labelNameInput = await screen.findByPlaceholderText('name');
    await act(async () => await userEvent.type(labelNameInput, 'labelName'));
    const labelValueInput = await screen.findByPlaceholderText('value');
    await act(async () => await userEvent.type(labelValueInput, 'labelValue'));
    await submitForm();
    expect(instance.api.addCheck).toHaveBeenCalledWith({
      job: 'tacos',
      target: 'grafana.com',
      alertSensitivity: 'none',
      enabled: true,
      labels: [{ name: 'labelName', value: 'labelValue' }],
      probes: [1],
      timeout: 3000,
      frequency: 60000,
      basicMetricsOnly: false,
      settings: {
        ping: {
          ipVersion: 'V4',
          dontFragment: false,
        },
      },
    });
  });

  it('correctly populates default values', async () => {
    const check = {
      id: 32,
      job: 'carne asada',
      target: 'target.com',
      alertSensitivity: AlertSensitivity.Medium,
      enabled: true,
      labels: [{ name: 'a great label', value: 'totally awesome label' }],
      probes: [42],
      timeout: 2000,
      frequency: 120000,
      settings: {
        ping: {
          ipVersion: IpVersion.V6,
          dontFragment: true,
        },
      },
      basicMetricsOnly: true,
    };

    await renderCheckEditor({ check });
    expect(await screen.findByLabelText('Job Name', { exact: false })).toHaveValue('carne asada');
    expect(await screen.findByLabelText('Target', { exact: false })).toHaveValue('target.com');
    expect(await screen.findByText('burritos')).toBeInTheDocument(); // display name of probe with id 42 returned in mocked listProbes call
    expect(await getSlider('frequency')).toHaveValue('120');
    expect(await getSlider('timeout')).toHaveValue('2');
    expect(await screen.findByLabelText('Enabled', { exact: false })).toBeChecked();
    const advancedOption = await screen.findByText('Advanced options');
    userEvent.click(advancedOption);
    expect(await screen.findByPlaceholderText('name')).toHaveValue('a great label');
    expect(await screen.findByPlaceholderText('value')).toHaveValue('totally awesome label');
    expect(await screen.findByText('V6')).toBeInTheDocument();
    expect(await screen.findByLabelText("Don't Fragment", { exact: false })).toBeChecked();
  });
});

describe('HTTP', () => {
  it('has correct sections', async () => {
    await renderCheckEditor();
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

  it('correctly populates default values for preexisting check', async () => {
    const check = {
      job: 'carne asada',
      id: 32,
      alertSensitivity: AlertSensitivity.Medium,
      target: 'https://target.com',
      enabled: true,
      labels: [{ name: 'a great label', value: 'totally awesome label' }],
      probes: [42],
      timeout: 2000,
      frequency: 120000,
      basicMetricsOnly: true,
      settings: {
        http: {
          method: HttpMethod.GET,
          headers: ['headerName:headerValue'],
          body: 'requestbody',
          ipVersion: IpVersion.V6,
          noFollowRedirects: true,
          tlsConfig: {
            insecureSkipVerify: true,
            caCert: transformedValidCert,
            clientCert: transformedValidCert,
            clientKey: transformedValidKey,
            serverName: 'serverName',
          },
          validStatusCodes: [100],
          validHTTPVersions: [HttpVersion.HTTP1_0],
          failIfNotSSL: true,
          failIfSSL: false,
          bearerToken: 'a bear',
          basicAuth: { username: 'steve', password: 'stevessecurepassword' },
          cacheBustingQueryParamName: 'busted',
          failIfBodyMatchesRegexp: ['body matches'],
          failIfBodyNotMatchesRegexp: ['body not maches'],
          failIfHeaderMatchesRegexp: [{ header: 'a header', regexp: 'matches', allowMissing: true }],
          failIfHeaderNotMatchesRegexp: [{ header: 'a different header', regexp: 'not matches', allowMissing: true }],
        },
      },
    };

    await renderCheckEditor({ check });
    expect(await screen.findByLabelText('Job name', { exact: false })).toHaveValue('carne asada');
    expect(await screen.findByLabelText('Enabled', { exact: false })).toBeChecked();
    expect(await screen.findByLabelText('Full URL to send requests to', { exact: false })).toHaveValue(
      'https://target.com'
    );
    expect(await screen.findByText('burritos')).toBeInTheDocument(); // display name of probe with id 42 returned in mocked listProbes call
    expect(await getSlider('frequency')).toHaveValue('120');
    expect(await getSlider('timeout')).toHaveValue('2');

    const httpSection = await toggleSection('HTTP settings');
    expect(await screen.findByText('GET')).toBeInTheDocument();
    expect(await screen.findByLabelText('Request body', { exact: false })).toHaveValue('requestbody');
    expect(await within(httpSection).findByPlaceholderText('name')).toHaveValue('headerName');
    expect(await within(httpSection).findByPlaceholderText('value')).toHaveValue('headerValue');

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
    expect(await within(advancedOptions).findByPlaceholderText('name')).toHaveValue('a great label');
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

  it('transforms values to correct format', async () => {
    // Couldn't get the target input to take a value in the testing environment, so starting with a default
    const instance = await renderCheckEditor({
      check: { ...defaultCheck, target: 'https://grafana.com' },
    });
    // Set Check Details
    await selectCheckType(CheckType.HTTP);
    await act(async () => await userEvent.type(await screen.findByLabelText('Job Name', { exact: false }), 'tacos'));

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
    await userEvent.click(await screen.findByRole('button', { name: 'Add header' }));
    await act(async () => await userEvent.type(await screen.findByPlaceholderText('name'), 'headerName'));
    await act(async () => await userEvent.type(await screen.findByPlaceholderText('value'), 'headerValue'));
    await toggleSection('HTTP settings');

    // TLS Config
    await toggleSection('TLS config');
    await act(async () => await userEvent.type(screen.getByLabelText('Server Name', { exact: false }), 'serverName'));
    // TextArea components misbehave when using userEvent.type, using paste for now as a workaround
    await act(async () => await userEvent.paste(screen.getByLabelText('CA Certificate', { exact: false }), validCert));
    await act(
      async () => await userEvent.paste(screen.getByLabelText('Client Certificate', { exact: false }), validCert)
    );
    await act(async () => await userEvent.paste(screen.getByLabelText('Client Key', { exact: false }), validKey));
    await toggleSection('TLS config');

    // Authentication
    const authentication = await toggleSection('Authentication');
    userEvent.click(await within(authentication).findByLabelText('Include bearer authorization header in request'));
    const bearerTokenInput = await screen.findByPlaceholderText('Bearer token');
    await act(async () => await userEvent.type(bearerTokenInput, 'a bearer token'));

    userEvent.click(await within(authentication).findByLabelText('Include basic authorization header in request'));
    const usernameInput = await within(authentication).findByPlaceholderText('Username');
    const passwordInput = await within(authentication).findByPlaceholderText('Password');
    await act(async () => await userEvent.type(usernameInput, 'a username'));
    await act(async () => await userEvent.type(passwordInput, 'a password'));

    // Validation
    const validationSection = await toggleSection('Validation');
    const [statusCodeInput, httpVersionInput] = await within(validationSection).findAllByTestId('select');
    await userEvent.selectOptions(statusCodeInput, [within(validationSection).getByText('100')]);
    await userEvent.selectOptions(httpVersionInput, [within(validationSection).getByText('HTTP/1.0')]);
    userEvent.click(await screen.findByRole('button', { name: 'Add Regex Validation' }));
    userEvent.click(await screen.findByRole('button', { name: 'Add Regex Validation' }));
    const selectMenus = await within(validationSection).findAllByTestId('select');
    const [matchSelect1, matchSelect2] = selectMenus.slice(-2);
    userEvent.selectOptions(
      matchSelect1,
      within(validationSection).getAllByText('Check fails if response header matches')[0]
    );

    await act(
      async () =>
        await userEvent.type(await within(validationSection).findByPlaceholderText('Header name'), 'Content-Type')
    );

    await act(
      async () =>
        await userEvent.type(await within(validationSection).getAllByPlaceholderText('Regex')[0], 'a header regex')
    );

    const option = within(validationSection).getAllByText('Check fails if response body matches')[1];
    userEvent.selectOptions(matchSelect2, option);
    const regexFields = await within(validationSection).getAllByPlaceholderText('Regex');
    await act(async () => await userEvent.type(regexFields[1], 'a body regex'));

    const [allowMissing, invertMatch] = await within(validationSection).findAllByRole('checkbox');
    userEvent.click(allowMissing);
    userEvent.click(invertMatch);

    await submitForm();

    expect(instance.api.addCheck).toHaveBeenCalledWith({
      job: 'tacos',
      target: 'https://grafana.com',
      enabled: true,
      labels: [],
      probes: [42],
      timeout: 3000,
      alertSensitivity: 'none',
      frequency: 60000,
      basicMetricsOnly: false,
      settings: {
        http: {
          method: 'GET',
          headers: ['headerName:headerValue'],
          body: 'requestbody',
          ipVersion: 'V4',
          noFollowRedirects: false,
          tlsConfig: {
            insecureSkipVerify: false,
            caCert: transformedValidCert,
            clientCert: transformedValidCert,
            clientKey: transformedValidKey,
            serverName: 'serverName',
          },
          validStatusCodes: [100],
          validHTTPVersions: ['HTTP/1.0'],
          failIfNotSSL: false,
          failIfSSL: false,
          basicAuth: {
            password: 'a password',
            username: 'a username',
          },
          bearerToken: 'a bearer token',
          failIfHeaderNotMatchesRegexp: [{ regexp: 'a header regex', allowMissing: true, header: 'Content-Type' }],
          failIfHeaderMatchesRegexp: [],
          failIfBodyMatchesRegexp: ['a body regex'],
          failIfBodyNotMatchesRegexp: [],
          cacheBustingQueryParamName: '',
        },
      },
    });
  });
});

describe('DNS', () => {
  it('has correct sections', async () => {
    await renderCheckEditor();
    await selectCheckType(CheckType.DNS);
    const dnsSettings = await screen.findByText('DNS settings');
    expect(dnsSettings).toBeInTheDocument();
    const validation = await screen.findByText('Validation');
    expect(validation).toBeInTheDocument();
    const advancedOptions = await screen.findByText('Advanced options');
    expect(advancedOptions).toBeInTheDocument();
  });

  describe('Validations', () => {
    it('handles authority validations', async () => {
      const instance = await renderCheckEditor({ check: getMinimumCheck() });
      await selectCheckType(CheckType.DNS);
      await toggleSection('Validation');
      const addRegex = await screen.findByRole('button', { name: 'Add RegEx Validation' });
      userEvent.click(addRegex);
      userEvent.click(addRegex);
      const expressionInputs = await screen.findAllByPlaceholderText('Type expression');
      await act(() => userEvent.type(expressionInputs[0], 'not inverted validation'));
      await act(() => userEvent.type(expressionInputs[1], 'inverted validation'));
      const invertedCheckboxes = await screen.findAllByRole('checkbox');
      userEvent.click(invertedCheckboxes[2]);
      await submitForm();
      expect(instance.api.addCheck).toHaveBeenCalledWith({
        job: 'tacos',
        target: 'burritos.com',
        enabled: true,
        labels: [],
        probes: [1],
        timeout: 3000,
        frequency: 60000,
        alertSensitivity: 'none',
        basicMetricsOnly: false,
        settings: {
          dns: {
            ipVersion: 'V4',
            port: 53,
            protocol: 'UDP',
            recordType: 'A',
            server: '8.8.8.8',
            validRCodes: [DnsResponseCodes.NOERROR],
            validateAdditionalRRS: {
              failIfMatchesRegexp: [],
              failIfNotMatchesRegexp: [],
            },
            validateAnswerRRS: {
              failIfMatchesRegexp: [],
              failIfNotMatchesRegexp: [],
            },
            validateAuthorityRRS: {
              failIfMatchesRegexp: ['inverted validation'],
              failIfNotMatchesRegexp: ['not inverted validation'],
            },
          },
        },
      });
    });

    it('handles answer validations', async () => {
      const instance = await renderCheckEditor({ check: getMinimumCheck() });
      await selectCheckType(CheckType.DNS);
      const dnsValidations = await toggleSection('Validation');
      const addRegex = await screen.findByRole('button', { name: 'Add RegEx Validation' });
      userEvent.click(addRegex);
      await selectDnsResponseMatchType(dnsValidations, ResponseMatchType.Answer);
      userEvent.click(addRegex);
      await selectDnsResponseMatchType(dnsValidations, ResponseMatchType.Answer);
      const expressionInputs = await screen.findAllByPlaceholderText('Type expression');
      await act(() => userEvent.type(expressionInputs[0], 'not inverted validation'));
      await userEvent.type(expressionInputs[1], 'inverted validation');
      const invertedCheckboxes = await screen.findAllByRole('checkbox');
      userEvent.click(invertedCheckboxes[2]);
      await submitForm();

      expect(instance.api.addCheck).toHaveBeenCalledWith({
        job: 'tacos',
        target: 'burritos.com',
        enabled: true,
        labels: [],
        probes: [1],
        timeout: 3000,
        alertSensitivity: 'none',
        frequency: 60000,
        basicMetricsOnly: false,
        settings: {
          dns: {
            ipVersion: 'V4',
            port: 53,
            protocol: 'UDP',
            recordType: 'A',
            server: '8.8.8.8',
            validRCodes: [DnsResponseCodes.NOERROR],
            validateAdditionalRRS: {
              failIfMatchesRegexp: [],
              failIfNotMatchesRegexp: [],
            },
            validateAnswerRRS: {
              failIfMatchesRegexp: ['inverted validation'],
              failIfNotMatchesRegexp: ['not inverted validation'],
            },
            validateAuthorityRRS: {
              failIfMatchesRegexp: [],
              failIfNotMatchesRegexp: [],
            },
          },
        },
      });
    });

    it('handles additional validations', async () => {
      const instance = await renderCheckEditor({ check: getMinimumCheck() });
      await selectCheckType(CheckType.DNS);
      const DnsValidations = await toggleSection('Validation');
      const addRegex = await screen.findByRole('button', { name: 'Add RegEx Validation' });
      userEvent.click(addRegex);
      await selectDnsResponseMatchType(DnsValidations, ResponseMatchType.Additional);
      userEvent.click(addRegex);
      await selectDnsResponseMatchType(DnsValidations, ResponseMatchType.Additional);
      const expressionInputs = await screen.findAllByPlaceholderText('Type expression');
      await act(() => userEvent.type(expressionInputs[0], 'not inverted validation'));
      await userEvent.type(expressionInputs[1], 'inverted validation');
      const invertedCheckboxes = await screen.findAllByRole('checkbox');
      userEvent.click(invertedCheckboxes[2]);

      await submitForm();

      expect(instance.api.addCheck).toHaveBeenCalledWith({
        job: 'tacos',
        target: 'burritos.com',
        enabled: true,
        labels: [],
        probes: [1],
        timeout: 3000,
        frequency: 60000,
        alertSensitivity: 'none',
        basicMetricsOnly: false,
        settings: {
          dns: {
            ipVersion: 'V4',
            port: 53,
            protocol: 'UDP',
            recordType: 'A',
            server: '8.8.8.8',
            validRCodes: [DnsResponseCodes.NOERROR],
            validateAdditionalRRS: {
              failIfMatchesRegexp: ['inverted validation'],
              failIfNotMatchesRegexp: ['not inverted validation'],
            },
            validateAnswerRRS: {
              failIfMatchesRegexp: [],
              failIfNotMatchesRegexp: [],
            },
            validateAuthorityRRS: {
              failIfMatchesRegexp: [],
              failIfNotMatchesRegexp: [],
            },
          },
        },
      });
    });
  });
});

describe('TCP', () => {
  it('transforms data correctly', async () => {
    const instance = await renderCheckEditor({ check: getMinimumCheck({ target: 'grafana.com:43' }) });
    await selectCheckType(CheckType.TCP);
    await submitForm();
    expect(instance.api.addCheck).toHaveBeenCalledWith({
      enabled: true,
      frequency: 60000,
      basicMetricsOnly: false,
      job: 'tacos',
      labels: [],
      probes: [1],
      alertSensitivity: 'none',
      settings: {
        tcp: {
          ipVersion: 'V4',
          tls: false,
          tlsConfig: {
            caCert: '',
            clientCert: '',
            clientKey: '',
            insecureSkipVerify: false,
            serverName: '',
          },
        },
      },
      target: 'grafana.com:43',
      timeout: 3000,
    });
  });
});
