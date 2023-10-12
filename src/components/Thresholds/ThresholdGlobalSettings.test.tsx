import React from 'react';
import { screen } from '@testing-library/react';

import { render } from 'test/render';
import ThresholdGlobalSettings from './ThresholdGlobalSettings';
import { getInstanceMock } from 'datasource/__mocks__/DataSource';
import { SuccessRateContextProvider } from 'components/SuccessRateContextProvider';

const onDismiss = jest.fn();
const onSuccess = jest.fn();
const onError = jest.fn();

const renderThresholdSettingsForm = (defaultValues = false) => {
  const instance = {
    api: getInstanceMock(),
  };

  if (defaultValues) {
    instance.api.getTenantSettings = jest.fn(() =>
      Promise.resolve({ thresholds: { uptime: {}, reachability: {}, latency: {} } })
    );
  }

  return render(
    <SuccessRateContextProvider checks={[]}>
      <ThresholdGlobalSettings onDismiss={onDismiss} onSuccess={onSuccess} onError={onError} isOpen={true} />
    </SuccessRateContextProvider>,
    {
      instance,
    }
  );
};

test('shows the form', async () => {
  renderThresholdSettingsForm();
  const saveButton = await screen.findByTestId('threshold-save');
  const inputs = await screen.findAllByPlaceholderText('value');
  expect(saveButton).toBeInTheDocument();
  expect(inputs).toHaveLength(12);
});

test('has default values in form', async () => {
  renderThresholdSettingsForm(true);
  const upperLimitInputs = await screen.findAllByTestId('upper-limit');
  const lowerLimitInputs = await screen.findAllByTestId('lower-limit');
  // Uptime/reachability
  expect(upperLimitInputs[0]).toHaveValue(90);
  expect(lowerLimitInputs[0]).toHaveValue(75);
  // Latency
  expect(upperLimitInputs[2]).toHaveValue(200);
  expect(lowerLimitInputs[2]).toHaveValue(1000);
});

test('submits the form', async () => {
  const { instance, user } = renderThresholdSettingsForm();
  const saveButton = await screen.findByTestId('threshold-save');
  await user.click(saveButton);

  expect(instance.api?.updateTenantSettings).toHaveBeenCalledWith({
    thresholds: {
      uptime: { upperLimit: 94.4, lowerLimit: 75 },
      reachability: { upperLimit: 71.7, lowerLimit: 70 },
      latency: { upperLimit: 249, lowerLimit: 182 },
    },
  });
});
