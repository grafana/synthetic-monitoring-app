import React from 'react';
import { render, screen, waitFor, act, within } from '@testing-library/react';
import { Check, IpVersion, CheckType, DnsResponseCodes, ResponseMatchType, HttpMethod, HttpVersion } from 'types';
import { CheckEditor } from './CheckEditor';
import { getInstanceMock } from '../../datasource/__mocks__/DataSource';
import userEvent from '@testing-library/user-event';
import { InstanceContext } from 'components/InstanceContext';
jest.setTimeout(30000);

// Data mocks

const defaultCheck = {
  job: '',
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
} as Check;

const getMinimumCheck = (overrides: Partial<Check> = {}) => ({
  ...defaultCheck,
  job: 'tacos',
  target: 'burritos.com',
  probes: [1],
  ...overrides,
});

const onReturn = jest.fn();

// Selectors

const selectCheckType = async (checkType: CheckType) => {
  const checkTypeInput = await screen.findByText('PING');
  userEvent.click(checkTypeInput);
  const selectMenu = await screen.findByLabelText('Select options menu');
  const option = await within(selectMenu).findByText(checkType.toUpperCase());
  userEvent.click(option);
  await screen.findByText(checkType.toUpperCase());
};

const openDnsValidations = async () => {
  await selectCheckType(CheckType.DNS);
  userEvent.click(await screen.findByText('Validation'));
};

const selectDnsResponseMatchType = async (responseMatch: ResponseMatchType) => {
  const responseMatchInput = await screen.findByText('Validate Authority matches');
  userEvent.click(responseMatchInput);
  const options = await screen.findAllByText(`Validate ${responseMatch} matches`);
  userEvent.click(options[options.length - 1]);
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

// Test Renderer
const renderCheckEditor = async ({ check = defaultCheck } = {}) => {
  const instance = getInstanceMock();
  render(
    <InstanceContext.Provider value={{ instance: { api: instance }, loading: false }}>
      <CheckEditor check={check} instance={instance} onReturn={onReturn} />
    </InstanceContext.Provider>
  );
  await waitFor(() => expect(screen.getByText('Check Details')).toBeInTheDocument());
  return instance;
};

it('Updates existing check', async () => {
  const instance = await renderCheckEditor({ check: getMinimumCheck({ target: 'grafana.com', id: 32, tenantId: 45 }) });
  await submitForm();
  expect(instance.addCheck).toHaveBeenCalledTimes(0);
  expect(instance.updateCheck).toHaveBeenCalledWith({
    job: 'tacos',
    id: 32,
    tenantId: 45,
    target: 'grafana.com',
    enabled: true,
    labels: [],
    probes: [1],
    timeout: 3000,
    frequency: 60000,
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
    expect(instance.addCheck).toHaveBeenCalledWith({
      job: 'tacos',
      target: 'grafana.com',
      enabled: true,
      labels: [{ name: 'labelName', value: 'labelValue' }],
      probes: [1],
      timeout: 3000,
      frequency: 60000,
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
    };

    await renderCheckEditor({ check });
    expect(await screen.findByLabelText('Job Name', { exact: false })).toHaveValue('carne asada');
    expect(await screen.findByLabelText('Target', { exact: false })).toHaveValue('target.com');
    expect(await screen.findByText('burritos')).toBeInTheDocument(); // display name of probe with id 42 returned in mocked listProbes call
    expect(await screen.findByLabelText('Frequency', { exact: false })).toHaveValue(120);
    expect(await screen.findByLabelText('Timeout', { exact: false })).toHaveValue(2);
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
      target: 'https://target.com',
      enabled: true,
      labels: [{ name: 'a great label', value: 'totally awesome label' }],
      probes: [42],
      timeout: 2000,
      frequency: 120000,
      settings: {
        http: {
          method: HttpMethod.GET,
          headers: ['headerName:headerValue'],
          body: 'requestbody',
          ipVersion: IpVersion.V6,
          noFollowRedirects: true,
          tlsConfig: {
            insecureSkipVerify: true,
            caCert: 'caCert',
            clientCert: 'clientCert',
            clientKey: 'client key',
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
    expect(await screen.findByLabelText('Frequency', { exact: false })).toHaveValue(120);
    expect(await screen.findByLabelText('Timeout', { exact: false })).toHaveValue(2);

    const httpSection = await toggleSection('HTTP settings');
    expect(await screen.findByText('GET')).toBeInTheDocument();
    expect(await screen.findByLabelText('Request body', { exact: false })).toHaveValue('requestbody');
    expect(await within(httpSection).findByPlaceholderText('name')).toHaveValue('headerName');
    expect(await within(httpSection).findByPlaceholderText('value')).toHaveValue('headerValue');

    await toggleSection('TLS config');
    expect(await screen.findByLabelText('Disable target certificate validation')).toBeChecked();
    expect(await screen.findByLabelText('Server name', { exact: false })).toHaveValue('serverName');
    expect(await screen.findByLabelText('CA certificate', { exact: false })).toHaveValue('caCert');
    expect(await screen.findByLabelText('Client certificate', { exact: false })).toHaveValue('clientCert');
    expect(await screen.findByLabelText('Client key', { exact: false })).toHaveValue('client key');

    await toggleSection('Authentication');
    expect(await screen.findByPlaceholderText('Bearer token')).toHaveValue('a bear');
    expect(await screen.findByPlaceholderText('Username')).toHaveValue('steve');
    expect(await screen.findByPlaceholderText('Password')).toHaveValue('stevessecurepassword');

    const validation = await toggleSection('Validation');

    expect(await within(validation).findByText('100')).toBeInTheDocument();
    expect(await within(validation).findByText('HTTP/1.0')).toBeInTheDocument();
    expect(await within(validation).findByText('Probe fails if SSL is not present.')).toBeInTheDocument();
    expect(await within(validation).findAllByText('Check fails if response header matches')).toHaveLength(2);
    const [header1, header2] = await within(validation).findAllByPlaceholderText('Header name');
    expect(header1).toHaveValue('a header');
    expect(header2).toHaveValue('a different header');
    expect(await within(validation).findAllByText('Check fails if response body matches')).toHaveLength(2);

    const advancedOptions = await toggleSection('Advanced options');
    expect(await within(advancedOptions).findByPlaceholderText('name')).toHaveValue('a great label');
    expect(await within(advancedOptions).findByPlaceholderText('value')).toHaveValue('totally awesome label');
    expect(await within(advancedOptions).findByText('V6')).toBeInTheDocument();
    // Follow redirect field
    expect(await within(advancedOptions).findByRole('checkbox')).not.toBeChecked();
    expect(
      await within(advancedOptions).findByLabelText('Cache busting query parameter name', { exact: false })
    ).toHaveValue('busted');
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

    userEvent.click(within(probeOptions).getByText('Choose'));
    // Select burritos probe options
    const probeSelectMenu = await screen.findByLabelText('Select options menu');
    userEvent.click(await within(probeSelectMenu).findByText('burritos'));

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
    await act(async () => await userEvent.paste(screen.getByLabelText('CA Certificate', { exact: false }), 'caCert'));
    await act(
      async () => await userEvent.paste(screen.getByLabelText('Client Certificate', { exact: false }), 'clientCert')
    );
    await act(async () => await userEvent.paste(screen.getByLabelText('Client Key', { exact: false }), 'client key'));
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
    const [statusCodeInput, httpVersionInput] = await within(validationSection).findAllByRole('textbox');
    await act(async () => await userEvent.click(statusCodeInput));
    await act(
      async () =>
        await userEvent.click(await within(await screen.findByLabelText('Select options menu')).findByText('100'))
    );
    userEvent.click(httpVersionInput);
    await act(
      async () =>
        await userEvent.click(await within(await screen.findByLabelText('Select options menu')).findByText('HTTP/1.0'))
    );
    userEvent.click(await screen.findByRole('button', { name: 'Add Regex Validation' }));
    userEvent.click(await within(validationSection).findByText('Field name'));
    userEvent.click(await within(validationSection).findByText('Check fails if response header matches'));

    await act(
      async () =>
        await userEvent.type(await within(validationSection).findByPlaceholderText('Header name'), 'Content-Type')
    );

    await act(
      async () => await userEvent.type(await within(validationSection).findByPlaceholderText('Regex'), 'a header regex')
    );

    const [allowMissing, invertMatch] = await within(validationSection).findAllByRole('checkbox');
    userEvent.click(allowMissing);
    userEvent.click(invertMatch);

    await submitForm();

    expect(instance.addCheck).toHaveBeenCalledWith({
      job: 'tacos',
      target: 'https://grafana.com',
      enabled: true,
      labels: [],
      probes: [42],
      timeout: 3000,
      frequency: 60000,
      settings: {
        http: {
          method: 'GET',
          headers: ['headerName:headerValue'],
          body: 'requestbody',
          ipVersion: 'V4',
          noFollowRedirects: false,
          tlsConfig: {
            insecureSkipVerify: false,
            caCert: 'caCert',
            clientCert: 'clientCert',
            clientKey: 'client key',
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
          failIfBodyMatchesRegexp: [],
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
      await openDnsValidations();
      const addRegex = await screen.findByRole('button', { name: 'Add RegEx Validation' });
      userEvent.click(addRegex);
      userEvent.click(addRegex);
      const expressionInputs = await screen.findAllByPlaceholderText('Type expression');
      await act(() => userEvent.type(expressionInputs[0], 'not inverted validation'));
      await userEvent.type(expressionInputs[1], 'inverted validation');
      const invertedCheckboxes = await screen.findAllByRole('checkbox');
      userEvent.click(invertedCheckboxes[1]);
      await submitForm();
      expect(instance.addCheck).toHaveBeenCalledWith({
        job: 'tacos',
        target: 'burritos.com',
        enabled: true,
        labels: [],
        probes: [1],
        timeout: 3000,
        frequency: 60000,
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
      await openDnsValidations();
      const addRegex = await screen.findByRole('button', { name: 'Add RegEx Validation' });
      userEvent.click(addRegex);
      await selectDnsResponseMatchType(ResponseMatchType.Answer);
      userEvent.click(addRegex);
      await selectDnsResponseMatchType(ResponseMatchType.Answer);
      const expressionInputs = await screen.findAllByPlaceholderText('Type expression');
      await act(() => userEvent.type(expressionInputs[0], 'not inverted validation'));
      await userEvent.type(expressionInputs[1], 'inverted validation');
      const invertedCheckboxes = await screen.findAllByRole('checkbox');
      userEvent.click(invertedCheckboxes[1]);
      await submitForm();

      expect(instance.addCheck).toHaveBeenCalledWith({
        job: 'tacos',
        target: 'burritos.com',
        enabled: true,
        labels: [],
        probes: [1],
        timeout: 3000,
        frequency: 60000,
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
      await openDnsValidations();
      const addRegex = await screen.findByRole('button', { name: 'Add RegEx Validation' });
      userEvent.click(addRegex);
      await selectDnsResponseMatchType(ResponseMatchType.Additional);
      userEvent.click(addRegex);
      await selectDnsResponseMatchType(ResponseMatchType.Additional);
      const expressionInputs = await screen.findAllByPlaceholderText('Type expression');
      await act(() => userEvent.type(expressionInputs[0], 'not inverted validation'));
      await userEvent.type(expressionInputs[1], 'inverted validation');
      const invertedCheckboxes = await screen.findAllByRole('checkbox');
      userEvent.click(invertedCheckboxes[1]);

      await submitForm();

      expect(instance.addCheck).toHaveBeenCalledWith({
        job: 'tacos',
        target: 'burritos.com',
        enabled: true,
        labels: [],
        probes: [1],
        timeout: 3000,
        frequency: 60000,
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
    expect(instance.addCheck).toHaveBeenCalledWith({
      enabled: true,
      frequency: 60000,
      job: 'tacos',
      labels: [],
      probes: [1],
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
