import React from 'react';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InstanceContext } from 'contexts/InstanceContext';
import ThresholdGlobalSettings from './ThresholdGlobalSettings';
import { GrafanaInstances, GlobalSettings } from 'types';
import { AppPluginMeta } from '@grafana/data';
import { getInstanceMock } from 'datasource/__mocks__/DataSource';
import { SuccessRateContextProvider } from 'components/SuccessRateContextProvider';

const onDismiss = jest.fn();
const onSuccess = jest.fn();
const onError = jest.fn();

const renderThresholdSettingsForm = () => {
  const instance = {
    api: getInstanceMock(),
    metrics: {},
    logs: {},
  } as GrafanaInstances;
  const meta = {} as AppPluginMeta<GlobalSettings>;

  render(
    <InstanceContext.Provider value={{ instance, loading: false, meta }}>
      <SuccessRateContextProvider checks={[]}>
        <ThresholdGlobalSettings onDismiss={onDismiss} onSuccess={onSuccess} onError={onError} isOpen={true} />
      </SuccessRateContextProvider>
    </InstanceContext.Provider>
  );

  return instance;
};

test('shows the form', async () => {
  renderThresholdSettingsForm();
  const saveButton = await screen.getByTestId('threshold-save');
  const inputs = await screen.getAllByPlaceholderText('value');
  expect(saveButton).toBeInTheDocument();
  expect(inputs).toHaveLength(12);
});

test('has default values in form', async () => {
  renderThresholdSettingsForm();
  const upperLimitInputs = await screen.getAllByTestId('upper-limit');
  const lowerLimitInputs = await screen.getAllByTestId('lower-limit');
  // Uptime/reachability
  expect(upperLimitInputs[0]).toHaveValue(90);
  expect(lowerLimitInputs[0]).toHaveValue(75);
  // Latency
  expect(upperLimitInputs[2]).toHaveValue(200);
  expect(lowerLimitInputs[2]).toHaveValue(1000);
});

test('submits the form', async () => {
  const instance = renderThresholdSettingsForm();
  const saveButton = await screen.getByTestId('threshold-save');
  userEvent.click(saveButton);
  expect(instance.api?.updateTenantSettings).toHaveBeenCalledWith({
    thresholds: {
      uptime: { upperLimit: 94.4, lowerLimit: 75 },
      reachability: { upperLimit: 71.7, lowerLimit: 70 },
      latency: { upperLimit: 249, lowerLimit: 182 },
    },
  });
});
