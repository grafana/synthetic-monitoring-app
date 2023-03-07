import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Router } from 'react-router-dom';
import { AppPluginMeta, DataSourceSettings, FeatureToggles } from '@grafana/data';
import { locationService } from '@grafana/runtime';
import { PLUGIN_URL_PATH } from 'components/constants';
import { InstanceContext } from 'contexts/InstanceContext';
import { getInstanceMock } from 'datasource/__mocks__/DataSource';
import { GlobalSettings, ROUTES } from 'types';
import { MultiHttpSettingsForm } from './MultiHttpSettingsForm';
import { BASIC_CHECK_LIST, BASIC_MULTIHTTP_CHECK } from 'components/CheckEditor/testConstants';
import { FeatureFlagProvider } from 'components/FeatureFlagProvider';
import { getSlider } from 'components/CheckEditor/testHelpers';

beforeEach(() => jest.resetAllMocks());
const onReturn = jest.fn();

async function renderForm(route: string) {
  locationService.push(`${PLUGIN_URL_PATH}${ROUTES.Checks}${route}`);
  const api = getInstanceMock();
  const instance = {
    api,
    alertRuler: {} as DataSourceSettings,
  };
  const meta = {} as AppPluginMeta<GlobalSettings>;
  const featureToggles = { 'multi-http': true } as unknown as FeatureToggles;
  const isFeatureEnabled = jest.fn(() => true);

  render(
    <FeatureFlagProvider overrides={{ featureToggles, isFeatureEnabled }}>
      <InstanceContext.Provider value={{ instance, loading: false, meta }}>
        <Router history={locationService.getHistory()}>
          <Route path={`${PLUGIN_URL_PATH}${ROUTES.Checks}/edit/:id`}>
            <MultiHttpSettingsForm checks={BASIC_CHECK_LIST} onReturn={onReturn} />
          </Route>
        </Router>
      </InstanceContext.Provider>
    </FeatureFlagProvider>
  );
  await waitFor(() => expect(screen.getByText('Probe options')).toBeInTheDocument());
  return instance;
}

describe('editing multihttp check', () => {
  it('renders correct values', async () => {
    const instance = await renderForm('/edit/6');
    expect(await screen.findByLabelText('Job name', { exact: false })).toHaveValue('basicmulti');
    // this is checking for the name of the probe
    expect(await screen.findByText('burritos')).toBeInTheDocument();
    expect(await getSlider('frequency')).toHaveValue('110');
    expect(await getSlider('timeout')).toHaveValue('2');

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
    const bodyTabs = await screen.findAllByLabelText('Tab Body');
    userEvent.click(bodyTabs[0]);
    userEvent.click(bodyTabs[1]);
    const requestBodies = await screen.findAllByLabelText('Request body', { exact: false });
    expect(requestBodies[0]).toHaveValue('');
    expect(requestBodies[1]).toHaveValue('{"averyinteresting":"request body content"}');

    // query params
    const queryParamTabs = await screen.findAllByLabelText('Tab Query Params');
    userEvent.click(queryParamTabs[0]);
    userEvent.click(queryParamTabs[1]);
    const queryParamNames = await screen.findAllByTestId('query-param-name');
    expect(queryParamNames[0]).toHaveValue('tacos');
    expect(queryParamNames[1]).toHaveValue('query');
    const queryParamValues = await screen.findAllByTestId('query-param-value');
    expect(queryParamValues[0]).toHaveValue('delicious');
    expect(queryParamValues[1]).toHaveValue('param');

    const variablesTabs = await screen.findAllByLabelText('Tab Variables');
    userEvent.click(variablesTabs[0]);
    userEvent.click(variablesTabs[1]);

    const submitButton = await screen.findByRole('button', { name: 'Save' });
    userEvent.click(submitButton);

    await waitFor(() => expect(onReturn).toHaveBeenCalledWith(true));
    expect(instance.api.updateCheck).toHaveBeenCalledTimes(1);
    expect(instance.api.updateCheck).toHaveBeenCalledWith({ id: 6, tenantId: undefined, ...BASIC_MULTIHTTP_CHECK });
  });

  it('allows user to edit and resubmit form', async () => {
    const instance = await renderForm('/edit/6');
    // expect(await screen.findAllByLabelText('Job name', { exact: false })).toHaveValue('basicmulti');
    const jobNameInput = await screen.findByLabelText('Job name');
    await act(async () => userEvent.clear(jobNameInput));
    await act(async () => userEvent.type(jobNameInput, 'basicmultiedited'));

    const targetInput = await screen.findAllByLabelText('Request target', { exact: false });
    await act(async () => userEvent.clear(targetInput[0]));
    await act(async () => userEvent.type(targetInput[0], 'http://grafanarr.com'));

    // The form definitely has the correct values here, but I can't get the test matcher to be find them
    const requestMethods = await screen.findAllByTestId('request-method');
    expect(requestMethods.length).toBe(2);

    // headers
    const request0HeaderNames = await screen.findAllByTestId('header-name-0');
    expect(request0HeaderNames).toHaveLength(2);
    expect(request0HeaderNames[0]).toHaveValue('aheader');
    await act(async () => await userEvent.clear(request0HeaderNames[0]));
    await act(async () => await userEvent.type(request0HeaderNames[0], 'rambling psyche'));
    expect(request0HeaderNames[0]).toHaveValue('rambling psyche');

    // body
    const bodyTabs = await screen.findAllByLabelText('Tab Body');
    userEvent.click(bodyTabs[0]);
    const requestBodies = await screen.getAllByLabelText('Request body', { exact: false });
    expect(requestBodies[0]).toHaveValue('');
    await act(async () => await userEvent.clear(requestBodies[0]));
    await act(async () => await userEvent.type(requestBodies[0], 'terriblyinteresting'));

    const submitButton = await screen.findByRole('button', { name: 'Save' });
    userEvent.click(submitButton);

    await waitFor(() => expect(onReturn).toHaveBeenCalledWith(true));
    expect(instance.api.updateCheck).toHaveBeenCalledTimes(1);
    expect(instance.api.updateCheck).toHaveBeenCalledWith(
      expect.objectContaining({
        job: 'basicmultiedited',
      })
    );
    expect(instance.api.updateCheck).toHaveBeenCalledWith(
      expect.objectContaining({
        settings: {
          multihttp: {
            entries: expect.arrayContaining([
              {
                request: {
                  body: 'terriblyinteresting',
                  headers: [
                    { name: 'rambling psyche', value: 'yarp' },
                    { name: 'carne', value: 'asada' },
                  ],
                  method: 'GET',
                  url: 'http://grafanarr.com',
                },
              },
            ]),
          },
        },
      })
    );
  });
});
