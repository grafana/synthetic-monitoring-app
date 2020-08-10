import React from 'react';
import { DnsSettingsForm } from './DnsSettings';
import { screen, render, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
jest.unmock('utils');

const onUpdateMock = jest.fn();
const defaultSettings = {};

const renderDnsSettings = ({ isEditor = true, onUpdate = onUpdateMock, settings = defaultSettings } = {}) => {
  return render(<DnsSettingsForm settings={settings} onUpdate={onUpdate} isEditor={isEditor} />);
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
    expect(onUpdateMock).toHaveBeenCalledWith({
      dns: {
        ipVersion: 'V4',
        port: 53,
        protocol: 'UDP',
        recordType: 'A',
        server: '8.8.8.8',
        showAdvanced: false,
        showValidation: true,
        validRCodes: [],
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
    });
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
    expect(onUpdateMock).toHaveBeenCalledWith({
      dns: {
        ipVersion: 'V4',
        port: 53,
        protocol: 'UDP',
        recordType: 'A',
        server: '8.8.8.8',
        showAdvanced: false,
        showValidation: true,
        validRCodes: [],
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
    });
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
    expect(onUpdateMock).toHaveBeenCalledWith({
      dns: {
        ipVersion: 'V4',
        port: 53,
        protocol: 'UDP',
        recordType: 'A',
        server: '8.8.8.8',
        showAdvanced: false,
        showValidation: true,
        validRCodes: [],
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
    });
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
    expect(onUpdateMock).toHaveBeenCalledWith({
      dns: {
        ipVersion: 'V4',
        port: 53,
        protocol: 'UDP',
        recordType: 'A',
        server: '8.8.8.8',
        showAdvanced: false,
        showValidation: true,
        validRCodes: [],
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
    });
  });
});
