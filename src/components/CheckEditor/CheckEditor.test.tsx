import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { Check, IpVersion, CheckType, DnsResponseCodes, ResponseMatchType } from 'types';
import { CheckEditor } from './CheckEditor';
import { getInstanceMock, instanceSettings } from '../../datasource/__mocks__/DataSource';
import userEvent from '@testing-library/user-event';

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

const minimumFieldCheck = {
  ...defaultCheck,
  job: 'tacos',
  target: 'burritos.com',
  probes: [1],
};

const onReturn = jest.fn();

const selectCheckType = async (checkType: CheckType) => {
  const checkTypeInput = await screen.findByText('PING');
  userEvent.click(checkTypeInput);
  const option = await screen.findByText(checkType.toUpperCase());
  userEvent.click(option);
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

const selectSubmitButton = async () => await screen.findByRole('button', { name: 'Save' });

const renderCheckEditor = async ({ check = defaultCheck } = {}) => {
  const instance = getInstanceMock();
  render(<CheckEditor check={check} instance={instance} onReturn={onReturn} />);
  await waitFor(() => expect(screen.getByText('Check Details')).toBeInTheDocument());
  return instance;
};

it('renders without crashing', async () => {
  await renderCheckEditor();
  const header = screen.getByText('Check Details');
  expect(header).toBeInTheDocument();
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
      const instance = await renderCheckEditor({ check: minimumFieldCheck });
      await openDnsValidations();
      const addRegex = await screen.findByRole('button', { name: 'Add RegEx Validation' });
      userEvent.click(addRegex);
      userEvent.click(addRegex);
      const expressionInputs = await screen.findAllByPlaceholderText('Type Expression');
      await act(() => userEvent.type(expressionInputs[0], 'not inverted validation'));
      await userEvent.type(expressionInputs[1], 'inverted validation');
      const invertedCheckboxes = await screen.findAllByRole('checkbox');
      userEvent.click(invertedCheckboxes[1]);
      const saveButton = await selectSubmitButton();
      userEvent.click(saveButton);

      await waitFor(() => expect(onReturn).toHaveBeenCalledWith(true));

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
      const instance = await renderCheckEditor({ check: minimumFieldCheck });
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
      const saveButton = await selectSubmitButton();
      userEvent.click(saveButton);

      await waitFor(() => expect(onReturn).toHaveBeenCalledWith(true));

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
      const instance = await renderCheckEditor({ check: minimumFieldCheck });
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
      const saveButton = await selectSubmitButton();
      userEvent.click(saveButton);

      await waitFor(() => expect(onReturn).toHaveBeenCalledWith(true));

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
