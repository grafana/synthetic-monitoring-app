import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { BASIC_CHECK_LIST, BASIC_MULTIHTTP_CHECK } from 'test/fixtures/checks';
import { PRIVATE_PROBE } from 'test/fixtures/probes';
import { apiRoute, getServerRequests } from 'test/handlers';
import { render } from 'test/render';
import { server } from 'test/server';

import { ROUTES } from 'types';
import { getSlider } from 'components/CheckEditor/testHelpers';
import { PLUGIN_URL_PATH } from 'components/constants';

import { MultiHttpSettingsForm } from './MultiHttpSettingsForm';

jest.setTimeout(60000);

beforeEach(() => jest.resetAllMocks());
const onReturn = jest.fn();

async function renderForm(route: string) {
  const res = waitFor(() =>
    render(<MultiHttpSettingsForm onReturn={onReturn} checks={BASIC_CHECK_LIST} />, {
      route: `${PLUGIN_URL_PATH}${ROUTES.Checks}/edit/:id`,
      path: `${PLUGIN_URL_PATH}${ROUTES.Checks}${route}`,
    })
  );
  await waitFor(() => expect(screen.getByText('Probe options')).toBeInTheDocument());
  return res;
}

describe('editing multihttp check', () => {
  it('renders correct values', async () => {
    const { record, read } = getServerRequests();
    server.use(apiRoute(`updateCheck`, {}, record));
    const targetCheck = BASIC_MULTIHTTP_CHECK;
    const { user } = await renderForm(`/edit/${targetCheck.id}`);
    expect(await screen.findByLabelText('Job name', { exact: false })).toHaveValue(targetCheck.job);
    // this is checking for the name of the probe
    expect(await screen.findByText(PRIVATE_PROBE.name)).toBeInTheDocument();
    expect(await getSlider('frequency')).toHaveValue((targetCheck.frequency / 1000).toString());
    expect(await getSlider('timeout')).toHaveValue((targetCheck.timeout / 1000).toString());

    // labels
    const labelNameInput = await screen.findByTestId('label-name-0');
    expect(labelNameInput).toHaveValue(targetCheck.labels[0].name);
    const labelValueInput = await screen.findByTestId('label-value-0');
    expect(labelValueInput).toHaveValue(targetCheck.labels[0].value);

    //targets
    const targets = await screen.findAllByLabelText('Request target', { exact: false });
    expect(targets[0]).toHaveValue(targetCheck.settings.multihttp?.entries[0].request.url);
    expect(targets[1]).toHaveValue(targetCheck.settings.multihttp?.entries[1].request.url);

    // headers
    const request0HeaderNames = await screen.findAllByTestId('header-name-0');
    expect(request0HeaderNames).toHaveLength(2);
    expect(request0HeaderNames[0]).toHaveValue(targetCheck.settings.multihttp?.entries[0].request.headers?.[0].name);
    expect(request0HeaderNames[1]).toHaveValue(targetCheck.settings.multihttp?.entries[0].request.headers?.[1].name);

    const request1HeaderNames = await screen.findAllByTestId('header-name-1');
    expect(request1HeaderNames).toHaveLength(1);
    expect(request1HeaderNames[0]).toHaveValue(targetCheck.settings.multihttp?.entries[1].request.headers?.[0].name);

    const request0HeaderValues = await screen.findAllByTestId('header-value-0');
    expect(request0HeaderValues).toHaveLength(2);
    expect(request0HeaderValues[0]).toHaveValue(targetCheck.settings.multihttp?.entries[0].request.headers?.[0].value);
    expect(request0HeaderValues[1]).toHaveValue(targetCheck.settings.multihttp?.entries[0].request.headers?.[1].value);

    const request1HeaderValues = await screen.findAllByTestId('header-value-1');
    expect(request1HeaderValues).toHaveLength(1);
    expect(request1HeaderValues[0]).toHaveValue(targetCheck.settings.multihttp?.entries[1].request.headers?.[0].value);

    // body
    // There is only one body tab because body tabs only show up for certain request methods
    const bodyTabs = await screen.findAllByLabelText('Tab Body');
    await user.click(bodyTabs[0]);
    const requestBodies = await screen.findAllByLabelText('Request body payload', { exact: false });
    expect(requestBodies[0]).toHaveValue(
      // @ts-expect-error
      atob(BASIC_MULTIHTTP_CHECK.settings.multihttp.entries[1].request.body.payload)
    );

    // query params
    const queryParamTabs = await screen.findAllByLabelText('Tab Query Params');
    await user.click(queryParamTabs[0]);
    await user.click(queryParamTabs[1]);
    const queryParamNames = await screen.findAllByTestId('query-param-name');
    expect(queryParamNames[0]).toHaveValue(targetCheck.settings.multihttp?.entries[0].request.queryFields?.[0].name);
    expect(queryParamNames[1]).toHaveValue(targetCheck.settings.multihttp?.entries[1].request.queryFields?.[0].name);
    const queryParamValues = await screen.findAllByTestId('query-param-value');
    expect(queryParamValues[0]).toHaveValue(targetCheck.settings.multihttp?.entries[0].request.queryFields?.[0].value);
    expect(queryParamValues[1]).toHaveValue(targetCheck.settings.multihttp?.entries[1].request.queryFields?.[0].value);

    const variablesTabs = await screen.findAllByLabelText('Tab Variables');
    await user.click(variablesTabs[0]);
    await user.click(variablesTabs[1]);

    const submitButton = await screen.findByRole('button', { name: 'Save' });
    await user.click(submitButton);

    await waitFor(() => expect(onReturn).toHaveBeenCalledWith(true));

    const { body } = await read();
    expect(body).toEqual(targetCheck);
  });

  it('allows user to edit and resubmit form', async () => {
    const targetCheck = BASIC_MULTIHTTP_CHECK;
    const NEW_JOB_NAME = 'basicmultiedited';
    const NEW_LABEL = { name: 'editedlabelname', value: 'editedlabelvalue' };
    const NEW_TARGET = 'http://grafanarr.com';
    const NEW_HEADER = { name: 'rambling psyche', value: 'yarp' };
    const NEW_BODY = 'terriblyinteresting';
    const MODIFIED_CHECK1 = {
      condition: 4,
      expression: 'expresso',
      type: 1,
      value: 'yarp',
    };

    const MODIFIED_CHECK2 = { expression: '/regex/', subject: 1, type: 3 };

    const { record, read } = getServerRequests();
    server.use(apiRoute(`updateCheck`, {}, record));
    const { user } = await renderForm(`/edit/${targetCheck.id}`);
    // edit job name
    const jobNameInput = await screen.findByLabelText('Job name');
    await user.clear(jobNameInput);
    await user.type(jobNameInput, NEW_JOB_NAME);

    // Add a custom label
    const labelNameInput = await screen.findByTestId('label-name-0');
    await user.clear(labelNameInput);
    await user.type(labelNameInput, NEW_LABEL.name);
    const labelValueInput = await screen.findByTestId('label-value-0');
    await user.clear(labelValueInput);
    await user.type(labelValueInput, NEW_LABEL.value);

    // edit target
    const targetInput = await screen.findAllByLabelText('Request target', { exact: false });
    await user.clear(targetInput[0]);
    await user.type(targetInput[0], NEW_TARGET);

    // edit headers
    const request0HeaderNames = await screen.findAllByTestId('header-name-0');
    expect(request0HeaderNames).toHaveLength(2);
    await user.clear(request0HeaderNames[0]);
    await user.type(request0HeaderNames[0], NEW_HEADER.name);

    // edit body
    const bodyTabs = await screen.findAllByLabelText('Tab Body');
    await user.click(bodyTabs[0]);
    const requestBodies = await screen.getAllByLabelText('Request body', { exact: false });
    await user.clear(requestBodies[0]);
    await user.type(requestBodies[0], NEW_BODY);

    // edit assertions
    const assertionsTabs = await screen.findAllByLabelText('Tab Assertions');
    await user.click(assertionsTabs[0]);
    const assertionTypes = await screen.findAllByLabelText('Method for finding assertion value', { exact: false });
    await user.selectOptions(assertionTypes[0], '1');

    const expressions = await screen.findAllByLabelText('See here for selector syntax', { exact: false });
    await user.clear(expressions[0]);
    await user.type(expressions[0], MODIFIED_CHECK1.expression);
    const conditions = await screen.findAllByLabelText('Condition', { exact: false });
    await user.selectOptions(conditions[0], MODIFIED_CHECK1.condition.toString());
    const values = await screen.findAllByLabelText('Value to compare with result of expression', { exact: false });
    await user.clear(values[0]);
    await user.type(values[0], MODIFIED_CHECK1.value);

    const subjects = await screen.findAllByLabelText('Subject', { exact: false });
    await user.selectOptions(subjects[0], MODIFIED_CHECK2.subject.toString());

    const submitButton = await screen.findByRole('button', { name: 'Save' });
    await user.click(submitButton);

    await waitFor(() => expect(onReturn).toHaveBeenCalledWith(true));

    const { body } = await read();
    expect(body).toEqual({
      ...targetCheck,
      target: NEW_TARGET,
      job: NEW_JOB_NAME,
      labels: [NEW_LABEL],
      settings: {
        multihttp: {
          entries: [
            {
              checks: [
                MODIFIED_CHECK1,
                ...targetCheck.settings.multihttp?.entries[0].checks.slice(1, 3)!,
                MODIFIED_CHECK2,
                ,
              ],
              request: {
                ...targetCheck.settings.multihttp?.entries[0].request,
                headers: [NEW_HEADER, targetCheck.settings.multihttp?.entries[0].request.headers?.[1]],
                url: NEW_TARGET,
              },
              variables: targetCheck.settings.multihttp?.entries[0].variables,
            },
            {
              checks: [],
              request: {
                ...targetCheck.settings.multihttp?.entries[1].request,
                body: {
                  ...targetCheck.settings.multihttp?.entries[1].request.body,
                  payload: btoa(NEW_BODY),
                },
              },
              variables: [],
            },
          ],
        },
      },
    });
  });
});
