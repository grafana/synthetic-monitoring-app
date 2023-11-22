import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from 'test/render';
import { getInstanceMock } from 'datasource/__mocks__/DataSource';

import { SuccessRateContextProvider } from 'components/SuccessRateContextProvider';

import ThresholdGlobalSettings from './ThresholdGlobalSettings';

const onDismiss = jest.fn();
const onSuccess = jest.fn();
const onError = jest.fn();

const renderThresholdSettingsForm = () => {
  const instance = {
    api: getInstanceMock(),
  };

  return waitFor(() =>
    render(
      <SuccessRateContextProvider>
        <ThresholdGlobalSettings onDismiss={onDismiss} onSuccess={onSuccess} onError={onError} />
      </SuccessRateContextProvider>,
      {
        instance,
      }
    )
  );
};

test('shows the form', async () => {
  await renderThresholdSettingsForm();
  const openButton = await screen.findByRole('button', { name: 'Set Thresholds' });
  await userEvent.click(openButton);
  const saveButton = await screen.findByTestId('threshold-save');
  const inputs = await screen.findAllByPlaceholderText('value');
  expect(saveButton).toBeInTheDocument();
  expect(inputs).toHaveLength(12);
});

test('has default values in form', async () => {
  const { user } = await renderThresholdSettingsForm();
  const openButton = await screen.findByRole('button', { name: 'Set Thresholds' });
  await userEvent.click(openButton);
  const upperLimitInputs = await screen.findAllByTestId('upper-limit');
  const lowerLimitInputs = await screen.findAllByTestId('lower-limit');
  await user.click(screen.getByText('Reset all to defaults'));
  // Uptime/reachability
  expect(upperLimitInputs[0]).toHaveValue(99);
  expect(lowerLimitInputs[0]).toHaveValue(75);
  // Latency
  expect(upperLimitInputs[2]).toHaveValue(200);
  expect(lowerLimitInputs[2]).toHaveValue(1000);
});

test('submits the form', async () => {
  const { instance, user } = await renderThresholdSettingsForm();
  const openButton = await screen.findByRole('button', { name: 'Set Thresholds' });
  await userEvent.click(openButton);
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
