import React from 'react';
import { render, screen, waitFor, act, within } from '@testing-library/react';
import { Check, IpVersion, CheckType, DnsResponseCodes, ResponseMatchType } from 'types';
import { CheckEditor } from './CheckEditor';
import { getInstanceMock } from '../../datasource/__mocks__/DataSource';
import userEvent from '@testing-library/user-event';
import { InstanceContext } from 'components/InstanceContext';
jest.setTimeout(14000);

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

const getMinimumCheck = (overrides: any = {}) => ({
  ...defaultCheck,
  job: 'tacos',
  target: 'burritos.com',
  probes: [1],
  ...overrides,
});

const onReturn = jest.fn();

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

const submitForm = async () => {
  const saveButton = await screen.findByRole('button', { name: 'Save' });
  expect(saveButton).not.toBeDisabled();
  userEvent.click(saveButton);
  await waitFor(() => expect(onReturn).toHaveBeenCalledWith(true));
};

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

it('renders without crashing', async () => {
  await renderCheckEditor();
  const header = screen.getByText('Check Details');
  expect(header).toBeInTheDocument();
});

describe('HTTP', () => {
  it('has correct sections', async () => {
    await renderCheckEditor();
    await selectCheckType(CheckType.HTTP);
    const httpSettings = await screen.findByText('HTTP Settings');
    expect(httpSettings).toBeInTheDocument();
    const tlsConfig = await screen.findByText('TLS Config');
    expect(tlsConfig).toBeInTheDocument();
    const authentication = await screen.findByText('Authentication');
    expect(authentication).toBeInTheDocument();
    const validation = await screen.findByText('Validation');
    expect(validation).toBeInTheDocument();
    const advanced = await screen.findByText('Advanced Options');
    expect(advanced).toBeInTheDocument();
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
    const probeOptions = screen.getByText('Probe Options').parentElement;
    if (!probeOptions) {
      throw new Error('Couldnt find Probe Options');
    }

    userEvent.click(within(probeOptions).getByText('Choose'));
    // Select burritos probe options
    const probeSelectMenu = await screen.findByLabelText('Select options menu');
    userEvent.click(await within(probeSelectMenu).findByText('burritos'));

    // HTTP Settings
    const httpSettings = await screen.findByText('HTTP Settings');
    userEvent.click(httpSettings);
    const requestBodyInput = await screen.findByLabelText('Request Body', { exact: false });
    await userEvent.paste(requestBodyInput, 'requestbody');
    await userEvent.click(await screen.findByRole('button', { name: 'Add Header' }));
    await act(async () => await userEvent.type(await screen.findByPlaceholderText('name'), 'headerName'));
    await act(async () => await userEvent.type(await screen.findByPlaceholderText('value'), 'headerValue'));
    userEvent.click(httpSettings);

    // TLS Config
    userEvent.click(screen.getByText('TLS Config'));
    await act(async () => await userEvent.type(screen.getByLabelText('Server Name', { exact: false }), 'serverName'));
    // TextArea components misbehave when using userEvent.type, using paste for now as a workaround
    await act(async () => await userEvent.paste(screen.getByLabelText('CA Certificate', { exact: false }), 'caCert'));
    await act(
      async () => await userEvent.paste(screen.getByLabelText('Client Certificate', { exact: false }), 'clientCert')
    );
    await act(async () => await userEvent.paste(screen.getByLabelText('Client Key', { exact: false }), 'client key'));
    userEvent.click(screen.getByText('TLS Config'));

    // Validation
    const validationHeader = screen.getByText('Validation');
    userEvent.click(validationHeader);
    const validationContainer = validationHeader.parentElement?.parentElement ?? new HTMLElement();
    const [statusCodeInput, httpVersionInput] = await within(validationContainer).findAllByRole('textbox');
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
    const dnsSettings = await screen.findByText('DNS Settings');
    expect(dnsSettings).toBeInTheDocument();
    const validation = await screen.findByText('Validation');
    expect(validation).toBeInTheDocument();
    const advancedOptions = await screen.findByText('Advanced Options');
    expect(advancedOptions).toBeInTheDocument();
  });

  describe('Validations', () => {
    it('handles authority validations', async () => {
      const instance = await renderCheckEditor({ check: getMinimumCheck() });
      await openDnsValidations();
      const addRegex = await screen.findByRole('button', { name: 'Add RegEx Validation' });
      userEvent.click(addRegex);
      userEvent.click(addRegex);
      const expressionInputs = await screen.findAllByPlaceholderText('Type Expression');
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
      const expressionInputs = await screen.findAllByPlaceholderText('Type Expression');
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
      const expressionInputs = await screen.findAllByPlaceholderText('Type Expression');
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
