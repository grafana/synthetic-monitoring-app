import React from 'react';
import DnsSettingsForm from './DnsSettings';
import { screen, render, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DnsResponseCodes, Label } from 'types';
jest.unmock('utils');
jest.setTimeout(10000);

const onUpdateMock = jest.fn();
const defaultSettings = {};
const defaultLabels: Label[] = [];

const renderDnsSettings = ({
  isEditor = true,
  onUpdate = onUpdateMock,
  settings = defaultSettings,
  labels = defaultLabels,
} = {}) => {
  return render(<DnsSettingsForm labels={labels} settings={settings} onUpdate={onUpdate} isEditor={isEditor} />);
};

beforeEach(() => {
  onUpdateMock.mockReset();
});

describe('Validations', () => {
  it('adds answer does match validations', async () => {
    renderDnsSettings();
    const validationExpandButton = await screen.findByText('Validation');
    userEvent.click(validationExpandButton);
    const answerValidations = await screen.findByTestId('validate-answer-matches');
    const addButton = await within(answerValidations).findByRole('button');
    userEvent.click(addButton);
    const addInput = await within(answerValidations).findByRole('textbox');
    await userEvent.type(addInput, 'a validation');
    expect(onUpdateMock).toHaveBeenLastCalledWith(
      {
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
            failIfMatchesRegexp: ['a validation'],
            failIfNotMatchesRegexp: [],
          },
          validateAuthorityRRS: {
            failIfMatchesRegexp: [],
            failIfNotMatchesRegexp: [],
          },
        },
      },
      []
    );
  });

  it('adds answer does not match validations', async () => {
    renderDnsSettings();
    const validationExpandButton = await screen.findByText('Validation');
    userEvent.click(validationExpandButton);
    const answerValidations = await screen.findByTestId('validate-answer-not-matches');
    const addButton = await within(answerValidations).findByRole('button');
    userEvent.click(addButton);
    const addInput = await within(answerValidations).findByRole('textbox');
    await userEvent.type(addInput, 'a validation');
    expect(onUpdateMock).toHaveBeenLastCalledWith(
      {
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
            failIfNotMatchesRegexp: ['a validation'],
          },
          validateAuthorityRRS: {
            failIfMatchesRegexp: [],
            failIfNotMatchesRegexp: [],
          },
        },
      },
      []
    );
  });

  it('adds authority does match validations', async () => {
    renderDnsSettings();
    const validationExpandButton = await screen.findByText('Validation');
    userEvent.click(validationExpandButton);
    const answerValidations = await screen.findByTestId('validate-authority-matches');
    const addButton = await within(answerValidations).findByRole('button');
    userEvent.click(addButton);
    const addInput = await within(answerValidations).findByRole('textbox');
    await userEvent.type(addInput, 'a validation');
    expect(onUpdateMock).toHaveBeenLastCalledWith(
      {
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
            failIfMatchesRegexp: ['a validation'],
            failIfNotMatchesRegexp: [],
          },
        },
      },
      []
    );
  });

  it('adds authority does not match validations', async () => {
    renderDnsSettings();
    const validationExpandButton = await screen.findByText('Validation');
    userEvent.click(validationExpandButton);
    const answerValidations = await screen.findByTestId('validate-authority-not-matches');
    const addButton = await within(answerValidations).findByRole('button');
    userEvent.click(addButton);
    const addInput = await within(answerValidations).findByRole('textbox');
    await userEvent.type(addInput, 'a validation');
    expect(onUpdateMock).toHaveBeenLastCalledWith(
      {
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
            failIfMatchesRegexp: [],
            failIfNotMatchesRegexp: ['a validation'],
          },
        },
      },
      []
    );
  });
});

describe('Response codes', () => {
  test('defaults to NOERROR', async () => {
    renderDnsSettings();
    const validationExpandButton = await screen.findByText('Validation');
    userEvent.click(validationExpandButton);
    const noErrorResponseCode = await screen.findByText(DnsResponseCodes.NOERROR);
    expect(noErrorResponseCode).toBeInTheDocument();
  });
});
