import React from 'react';
import { screen, waitFor } from '@testing-library/react';

import { render } from 'test/render';
import { PLUGIN_URL_PATH } from 'components/constants';
import { ROUTES } from 'types';
import { MultiHttpSettingsForm } from './MultiHttpSettingsForm';
import { BASIC_CHECK_LIST, BASIC_MULTIHTTP_CHECK } from 'components/CheckEditor/testConstants';
import { getSlider } from 'components/CheckEditor/testHelpers';

jest.setTimeout(60000);

beforeEach(() => jest.resetAllMocks());
const onReturn = jest.fn();

async function renderForm(route: string) {
  const res = render(<MultiHttpSettingsForm checks={BASIC_CHECK_LIST} onReturn={onReturn} />, {
    route: `${PLUGIN_URL_PATH}${ROUTES.Checks}/edit/:id`,
    path: `${PLUGIN_URL_PATH}${ROUTES.Checks}${route}`,
  });
  await waitFor(() => expect(screen.getByText('Probe options')).toBeInTheDocument());
  return res;
}

describe('editing multihttp check', () => {
  it('renders correct values', async () => {
    const { instance, user } = await renderForm('/edit/6');
    expect(await screen.findByLabelText('Job name', { exact: false })).toHaveValue('basicmulti');
    // this is checking for the name of the probe
    expect(await screen.findByText('burritos')).toBeInTheDocument();
    expect(await getSlider('frequency')).toHaveValue('110');
    expect(await getSlider('timeout')).toHaveValue('2');

    // edit log response bodies
    const logResponseBodies = await screen.findByTestId('logResponseBodies');
    expect(logResponseBodies).toBeChecked();

    //targets
    const targets = await screen.findAllByLabelText('Request target', { exact: false });
    expect(targets[0]).toHaveValue('https://www.grafana.com');
    expect(targets[1]).toHaveValue('https://www.example.com');

    // The form definitely has the correct values here, but I can't get the test matcher to be find them
    const requestMethods = await screen.findAllByTestId('request-method');
    expect(requestMethods.length).toBe(2);

    // headers
    const request0HeaderNames = await screen.findAllByTestId('header-name-0');
    expect(request0HeaderNames).toHaveLength(2);
    expect(request0HeaderNames[0]).toHaveValue('aheader');
    expect(request0HeaderNames[1]).toHaveValue('carne');

    const request1HeaderNames = await screen.findAllByTestId('header-name-1');
    expect(request1HeaderNames).toHaveLength(1);
    expect(request1HeaderNames[0]).toHaveValue('examples');

    const request0HeaderValues = await screen.findAllByTestId('header-value-0');
    expect(request0HeaderValues).toHaveLength(2);
    expect(request0HeaderValues[0]).toHaveValue('yarp');
    expect(request0HeaderValues[1]).toHaveValue('asada');

    const request1HeaderValues = await screen.findAllByTestId('header-value-1');
    expect(request1HeaderValues).toHaveLength(1);
    expect(request1HeaderValues[0]).toHaveValue('great');

    // body
    // There is only one body tab because body tabs only show up for certain request methods
    const bodyTabs = await screen.findAllByLabelText('Tab Body');
    await user.click(bodyTabs[0]);
    const requestBodies = await screen.findAllByLabelText('Request body payload', { exact: false });
    expect(requestBodies[0]).toHaveValue('{"averyinteresting":"request body content"}');

    // query params
    const queryParamTabs = await screen.findAllByLabelText('Tab Query Params');
    await user.click(queryParamTabs[0]);
    await user.click(queryParamTabs[1]);
    const queryParamNames = await screen.findAllByTestId('query-param-name');
    expect(queryParamNames[0]).toHaveValue('tacos');
    expect(queryParamNames[1]).toHaveValue('query');
    const queryParamValues = await screen.findAllByTestId('query-param-value');
    expect(queryParamValues[0]).toHaveValue('delicious');
    expect(queryParamValues[1]).toHaveValue('param');

    const variablesTabs = await screen.findAllByLabelText('Tab Variables');
    await user.click(variablesTabs[0]);
    await user.click(variablesTabs[1]);

    const submitButton = await screen.findByRole('button', { name: 'Save' });
    await user.click(submitButton);

    await waitFor(() => expect(onReturn).toHaveBeenCalledWith(true));
    expect(instance.api?.updateCheck).toHaveBeenCalledTimes(1);
    expect(instance.api?.updateCheck).toHaveBeenCalledWith({ id: 6, tenantId: undefined, ...BASIC_MULTIHTTP_CHECK });
  });

  it('allows user to edit and resubmit form', async () => {
    const { instance, user } = await renderForm('/edit/6');
    // edit job name
    const jobNameInput = await screen.findByLabelText('Job name');
    await user.clear(jobNameInput);
    await user.type(jobNameInput, 'basicmultiedited');

    // edit log response bodies
    const logResponseBodies = await screen.findByLabelText('Log response bodies', { exact: false });
    await user.click(logResponseBodies);

    // edit target
    const targetInput = await screen.findAllByLabelText('Request target', { exact: false });
    await user.clear(targetInput[0]);
    await user.type(targetInput[0], 'http://grafanarr.com');

    // edit headers
    const request0HeaderNames = await screen.findAllByTestId('header-name-0');
    expect(request0HeaderNames).toHaveLength(2);
    expect(request0HeaderNames[0]).toHaveValue('aheader');
    await user.clear(request0HeaderNames[0]);
    await user.type(request0HeaderNames[0], 'rambling psyche');
    expect(request0HeaderNames[0]).toHaveValue('rambling psyche');

    // edit body
    const bodyTabs = await screen.findAllByLabelText('Tab Body');
    await user.click(bodyTabs[0]);
    const requestBodies = await screen.getAllByLabelText('Request body', { exact: false });
    expect(requestBodies[0]).toHaveValue('{"averyinteresting":"request body content"}');
    await user.clear(requestBodies[0]);
    await user.type(requestBodies[0], 'terriblyinteresting');

    // edit assertions
    const assertionsTabs = await screen.findAllByLabelText('Tab Assertions');
    await user.click(assertionsTabs[0]);
    const assertionTypes = await screen.findAllByLabelText('Method for finding assertion value', { exact: false });
    await user.selectOptions(assertionTypes[0], '1');
    expect(assertionTypes[0]).toHaveValue('1');
    const expressions = await screen.findAllByLabelText('See here for selector syntax', { exact: false });
    await user.clear(expressions[0]);
    await user.type(expressions[0], 'expresso');
    const conditions = await screen.findAllByLabelText('Condition', { exact: false });
    await user.selectOptions(conditions[0], '4');
    const values = await screen.findAllByLabelText('Value to compare with result of expression', { exact: false });
    await user.clear(values[0]);
    await user.type(values[0], 'yarp');

    const subjects = await screen.findAllByLabelText('Subject', { exact: false });
    await user.selectOptions(subjects[0], '1');

    const submitButton = await screen.findByRole('button', { name: 'Save' });
    await user.click(submitButton);

    await waitFor(() => expect(onReturn).toHaveBeenCalledWith(true));
    expect(instance.api?.updateCheck).toHaveBeenCalledTimes(1);
    expect(instance.api?.updateCheck).toHaveBeenCalledWith(
      expect.objectContaining({
        job: 'basicmultiedited',
      })
    );
    expect(instance.api?.updateCheck).toHaveBeenCalledWith(
      expect.objectContaining({
        settings: {
          multihttp: {
            logResponseBodies: false,
            entries: [
              {
                checks: [
                  {
                    condition: 4,
                    expression: 'expresso',
                    type: 1,
                    value: 'yarp',
                  },
                  {
                    condition: 1,
                    expression: '$.jsonpathvalue-expression',
                    type: 1,
                    value: 'jsonpathvalue-value',
                  },
                  { expression: '$.jsonpath-expression', type: 2 },
                  { expression: '/regex/', subject: 1, type: 3 },
                ],
                request: {
                  headers: [
                    { name: 'rambling psyche', value: 'yarp' },
                    { name: 'carne', value: 'asada' },
                  ],
                  method: 'GET',
                  queryFields: [{ name: 'tacos', value: 'delicious' }],
                  url: 'http://grafanarr.com',
                },
                variables: [
                  { expression: 'mole', name: 'enchiladas', type: 0 },
                  { expression: 'picante', name: 'salsa', type: 1 },
                  {
                    attribute: 'churro',
                    expression: 'delicioso',
                    name: 'chimichanga',
                    type: 2,
                  },
                ],
              },
              {
                checks: [],
                request: {
                  body: {
                    contentEncoding: 'encoding',
                    contentType: 'steve',
                    payload: 'dGVycmlibHlpbnRlcmVzdGluZw==',
                  },
                  headers: [{ name: 'examples', value: 'great' }],
                  method: 'POST',
                  queryFields: [
                    { name: 'query', value: 'param' },
                    { name: 'using variable', value: '${enchiladas}' },
                  ],
                  url: 'https://www.example.com',
                },
                variables: [],
              },
            ],
          },
        },
      })
    );
  });
});
