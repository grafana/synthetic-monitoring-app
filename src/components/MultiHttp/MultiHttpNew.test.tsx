import React from 'react';
import { screen, waitFor, within } from '@testing-library/react';
import { createInstance, render } from 'test/render';

import { CheckType, ROUTES } from 'types';
import { BASIC_CHECK_LIST } from 'components/CheckEditor/testConstants';
import { submitForm } from 'components/CheckEditor/testHelpers';
import { PLUGIN_URL_PATH } from 'components/constants';

import { MultiHttpSettingsForm } from './MultiHttpSettingsForm';

jest.setTimeout(60000);

beforeEach(() => jest.resetAllMocks());
const onReturn = jest.fn();

const renderNewMultiForm = async () => {
  const instance = createInstance();
  instance.api.listChecks = jest.fn().mockResolvedValue(BASIC_CHECK_LIST);
  const res = render(<MultiHttpSettingsForm onReturn={onReturn} />, {
    route: `${PLUGIN_URL_PATH}${ROUTES.Checks}/new/${CheckType.MULTI_HTTP}`,
    path: `${PLUGIN_URL_PATH}${ROUTES.Checks}/new/${CheckType.MULTI_HTTP}`,
  });

  await waitFor(() => expect(screen.getByText('Probe options')).toBeInTheDocument());
  return res;
};

describe('new checks', () => {
  it('can create a new MULTI-HTTP check', async () => {
    const { instance, user } = await renderNewMultiForm();

    const jobNameInput = await screen.findByLabelText('Job name', { exact: false });
    await user.type(jobNameInput, 'basicmulti');

    const targetInput = await screen.findByLabelText('Request target', { exact: false });
    await user.type(targetInput, 'http://grafanarr.com');

    const requestOptions = await screen.findByTestId('request-method');
    await user.selectOptions(requestOptions, within(requestOptions).getByText('POST'));

    // Set probe options
    const probeOptions = screen.getByText('Probe options');
    if (!probeOptions) {
      throw new Error('Couldnt find Probe Options');
    }
    // // Select burritos probe options
    const probeSelectMenu = await screen.findByTestId('select');
    await user.selectOptions(probeSelectMenu, within(probeSelectMenu).getByText('burritos'));

    // Add a custom label
    const addCustomLabelButton = await screen.findByRole('button', { name: /Add label/ });
    await user.click(addCustomLabelButton);
    const labelNameInput = await screen.findByTestId('label-name-0');
    await user.type(labelNameInput, 'customlabelname');
    const labelValueInput = await screen.findByTestId('label-value-0');
    await user.type(labelValueInput, 'customlabelvalue');

    const addRequestButton = await screen.findByText('Add request');
    await user.click(addRequestButton);

    const secondTargetInput = await screen.findAllByLabelText('Request target', { exact: false });
    await user.type(secondTargetInput[1], 'http://grafanalalala.com');
    const secondRequestOptions = await screen.findAllByTestId('request-method');
    await user.selectOptions(secondRequestOptions[1], 'GET');

    // add assertions
    // reopens the first request
    const requestContainer = await screen.findByText('http://grafanarr.com');
    await user.click(requestContainer);
    const assertionsTabs = await screen.findAllByLabelText('Tab Assertions');
    await user.click(assertionsTabs[0]);
    const addAssertion = await screen.findByRole('button', { name: 'Add assertions' });
    await user.click(addAssertion);
    const assertionTypes = await screen.findAllByLabelText('Assertion type', { exact: false });
    await user.selectOptions(assertionTypes[0], '1');
    const expressions = await screen.findAllByLabelText('Expression', { exact: false });
    await user.type(expressions[0], 'expresso');
    const conditions = await screen.findAllByLabelText('Condition', { exact: false });
    await user.selectOptions(conditions[0], '4');
    const values = await screen.findAllByLabelText('Value to compare with result of expression', { exact: false });
    await user.clear(values[0]);
    await user.type(values[0], 'yarp');

    await submitForm(onReturn, user);

    expect(instance.api?.addCheck).toHaveBeenCalledTimes(1);

    expect(instance.api?.addCheck).toHaveBeenCalledWith({
      target: 'http://grafanarr.com',
      timeout: 15000,
      alertSensitivity: 'none',
      basicMetricsOnly: true,
      enabled: true,
      frequency: 120000,
      job: 'basicmulti',
      labels: [
        {
          name: 'customlabelname',
          value: 'customlabelvalue',
        },
      ],
      probes: [42],
      settings: {
        multihttp: {
          logResponseBodies: false,
          entries: [
            {
              request: { headers: [], queryFields: [], method: 'POST', url: 'http://grafanarr.com', body: undefined },
              variables: [],
              checks: [{ condition: 4, expression: 'expresso', type: 1, value: 'yarp' }],
            },
            {
              request: {
                headers: [],
                queryFields: [],
                method: 'GET',
                url: 'http://grafanalalala.com',
                body: undefined,
              },
              variables: [],
              checks: [],
            },
          ],
        },
      },
    });
  });
});
