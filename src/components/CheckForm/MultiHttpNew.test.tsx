import React from 'react';
import { screen, waitFor, within } from '@testing-library/react';
import { PUBLIC_PROBE } from 'test/fixtures/probes';
import { apiRoute, getServerRequests } from 'test/handlers';
import { render } from 'test/render';
import { server } from 'test/server';

import { AlertSensitivity, CheckType, ROUTES } from 'types';
import { submitForm } from 'components/CheckEditor/testHelpers';
import { PLUGIN_URL_PATH } from 'components/constants';

import { CheckForm } from './CheckForm';

jest.setTimeout(60000);

const renderNewMultiForm = async () => {
  const res = render(<CheckForm />, {
    route: `${PLUGIN_URL_PATH}${ROUTES.Checks}/new/${CheckType.MULTI_HTTP}`,
    path: `${PLUGIN_URL_PATH}${ROUTES.Checks}/new/${CheckType.MULTI_HTTP}`,
  });

  await waitFor(() => expect(screen.getByText('Probe options')).toBeInTheDocument());
  return res;
};

describe('new checks', () => {
  it('can create a new MULTI-HTTP check', async () => {
    const { record, read } = getServerRequests();
    server.use(apiRoute(`addCheck`, {}, record));

    const JOB = 'basicmulti';
    const TARGET = 'http://grafanarr.com';
    const LABELS = [{ name: 'customlabelname', value: 'customlabelvalue' }];
    const REQUEST_1 = {
      request: { headers: [], queryFields: [], method: 'POST', url: 'http://grafanarr.com', body: undefined },
      variables: [],
      checks: [{ condition: 4, expression: 'expresso', type: 1, value: 'yarp' }],
    };

    const REQUEST_2 = {
      request: {
        headers: [],
        queryFields: [],
        method: 'GET',
        url: 'http://grafanalalala.com',
        body: undefined,
      },
      variables: [],
      checks: [],
    };

    const { user } = await renderNewMultiForm();

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
    await user.selectOptions(probeSelectMenu, within(probeSelectMenu).getByText(PUBLIC_PROBE.name));

    // Add a custom label
    const addCustomLabelButton = await screen.findByRole('button', { name: /Add label/ });
    await user.click(addCustomLabelButton);
    const labelNameInput = await screen.findByTestId('label-name-0');
    await user.type(labelNameInput, LABELS[0].name);
    const labelValueInput = await screen.findByTestId('label-value-0');
    await user.type(labelValueInput, LABELS[0].value);

    const addRequestButton = await screen.findByText('Add request');
    await user.click(addRequestButton);

    const secondTargetInput = await screen.findAllByLabelText('Request target', { exact: false });
    await user.type(secondTargetInput[1], REQUEST_2.request.url);
    const secondRequestOptions = await screen.findAllByTestId('request-method');
    await user.selectOptions(secondRequestOptions[1], REQUEST_2.request.method);

    // add assertions
    // reopens the first request
    const requestContainer = await screen.findByText(TARGET);
    await user.click(requestContainer);
    const assertionsTabs = await screen.findAllByLabelText('Tab Assertions');
    await user.click(assertionsTabs[0]);
    const addAssertion = await screen.findByRole('button', { name: 'Add assertions' });
    await user.click(addAssertion);
    const assertionTypes = await screen.findAllByLabelText('Assertion type', { exact: false });
    await user.selectOptions(assertionTypes[0], REQUEST_1.checks[0].type.toString());
    const expressions = await screen.findAllByLabelText('Expression', { exact: false });
    await user.type(expressions[0], REQUEST_1.checks[0].expression);
    const conditions = await screen.findAllByLabelText('Condition', { exact: false });
    await user.selectOptions(conditions[0], REQUEST_1.checks[0].condition.toString());
    const values = await screen.findAllByLabelText('Value to compare with result of expression', { exact: false });
    await user.clear(values[0]);
    await user.type(values[0], REQUEST_1.checks[0].value);

    await submitForm(user);

    const { body } = await read();

    expect(body).toEqual({
      target: TARGET,
      timeout: 15000,
      alertSensitivity: AlertSensitivity.None,
      basicMetricsOnly: true,
      enabled: true,
      frequency: 120000,
      job: JOB,
      labels: LABELS,
      probes: [PUBLIC_PROBE.id],
      settings: {
        multihttp: {
          entries: [REQUEST_1, REQUEST_2],
        },
      },
    });
  });
});
