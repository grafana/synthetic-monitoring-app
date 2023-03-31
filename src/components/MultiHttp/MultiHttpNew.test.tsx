import React from 'react';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CheckType, GlobalSettings, ROUTES } from 'types';
import { getInstanceMock } from '../../datasource/__mocks__/DataSource';
import { InstanceContext } from 'contexts/InstanceContext';
import { AppPluginMeta, DataSourceSettings, FeatureToggles } from '@grafana/data';
import { PLUGIN_URL_PATH } from 'components/constants';
import { FeatureFlagProvider } from 'components/FeatureFlagProvider';
import { Route, Router } from 'react-router-dom';
import { MultiHttpSettingsForm } from './MultiHttpSettingsForm';
import { submitForm } from 'components/CheckEditor/testHelpers';
import { BASIC_CHECK_LIST } from 'components/CheckEditor/testConstants';
import { locationService } from '@grafana/runtime';

beforeEach(() => jest.resetAllMocks());
const onReturn = jest.fn();

const renderNewMultiForm = async () => {
  locationService.push(`${PLUGIN_URL_PATH}${ROUTES.Checks}/new/${CheckType.MULTI_HTTP}`);
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
          <Route path={`${PLUGIN_URL_PATH}${ROUTES.Checks}/new/${CheckType.MULTI_HTTP}`}>
            <MultiHttpSettingsForm checks={BASIC_CHECK_LIST} onReturn={onReturn} />
          </Route>
        </Router>
      </InstanceContext.Provider>
    </FeatureFlagProvider>
  );

  await waitFor(() => expect(screen.getByText('Probe options')).toBeInTheDocument());
  return instance;
};

describe('new checks', () => {
  it('can create a new MULTI-HTTP check', async () => {
    const instance = await renderNewMultiForm();

    const jobNameInput = await screen.findByLabelText('Job name', { exact: false });
    userEvent.type(jobNameInput, 'basicmulti');

    const targetInput = await screen.findByLabelText('Request target', { exact: false });
    userEvent.type(targetInput, 'http://grafanarr.com');

    const requestOptions = await screen.findByTestId('request-method');
    await act(async () => await userEvent.selectOptions(requestOptions, within(requestOptions).getByText('POST')));

    // Set probe options
    const probeOptions = screen.getByText('Probe options');
    if (!probeOptions) {
      throw new Error('Couldnt find Probe Options');
    }
    // // Select burritos probe options
    const probeSelectMenu = await screen.findByTestId('select');
    await act(
      async () => await userEvent.selectOptions(probeSelectMenu, within(probeSelectMenu).getByText('burritos'))
    );

    const addRequestButton = await screen.findByText('Add request');
    userEvent.click(addRequestButton);

    const secondTargetInput = await screen.findAllByLabelText('Request target', { exact: false });
    userEvent.type(secondTargetInput[1], 'http://grafanalalala.com');
    const secondRequestOptions = await screen.findAllByTestId('request-method');
    await act(async () => await userEvent.selectOptions(secondRequestOptions[1], 'GET'));

    await submitForm(onReturn);
    expect(instance.api.addCheck).toHaveBeenCalledTimes(1);
    expect(instance.api.addCheck).toHaveBeenCalledWith(
      expect.objectContaining({
        settings: {
          multihttp: {
            entries: [
              { request: { headers: [], method: 'POST', url: 'http://grafanarr.com' }, variables: [] },
              { request: { headers: [], method: 'GET', url: 'http://grafanalalala.com' }, variables: [] },
            ],
          },
        },
      })
    );
  });
});
