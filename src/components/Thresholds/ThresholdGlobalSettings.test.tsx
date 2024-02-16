import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { TENANT_SETTINGS } from 'test/fixtures/tenants';
import { apiRoute, getServerRequests } from 'test/handlers';
import { render } from 'test/render';
import { server } from 'test/server';

import { SuccessRateContextProvider } from 'components/SuccessRateContextProvider';

import ThresholdGlobalSettings from './ThresholdGlobalSettings';

const onDismiss = jest.fn();
const onSuccess = jest.fn();
const onError = jest.fn();

const renderThresholdSettingsForm = () => {
  return waitFor(() =>
    render(
      <SuccessRateContextProvider>
        <ThresholdGlobalSettings onDismiss={onDismiss} onSuccess={onSuccess} onError={onError} isOpen={true} />
      </SuccessRateContextProvider>
    )
  );
};

test('shows the form', async () => {
  await renderThresholdSettingsForm();
  const saveButton = await screen.findByTestId('threshold-save');
  const inputs = await screen.findAllByPlaceholderText('value');
  expect(saveButton).toBeInTheDocument();
  expect(inputs).toHaveLength(12);
});

test('has default values in form', async () => {
  const { user } = await renderThresholdSettingsForm();
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
  const { record, read } = getServerRequests();
  server.use(apiRoute('updateTenantSettings', {}, record));

  const { user } = await renderThresholdSettingsForm();
  const saveButton = await screen.findByTestId('threshold-save');
  await user.click(saveButton);

  const { body } = await read();
  expect(body).toEqual({ thresholds: TENANT_SETTINGS.thresholds });
});
