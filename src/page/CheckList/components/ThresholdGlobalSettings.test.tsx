import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { THRESHOLD_LOWER_LIMIT_TEST_ID, THRESHOLD_SAVE_TEST_ID, THRESHOLD_UPPER_LIMIT_TEST_ID } from 'test/dataTestIds';
import { TENANT_SETTINGS } from 'test/fixtures/tenants';
import { apiRoute, getServerRequests } from 'test/handlers';
import { render } from 'test/render';
import { server } from 'test/server';

import { ThresholdGlobalSettings } from './ThresholdGlobalSettings';

const onDismiss = jest.fn();

const renderThresholdSettingsForm = () => {
  return waitFor(() => render(<ThresholdGlobalSettings onDismiss={onDismiss} isOpen={true} />));
};

test('shows the form', async () => {
  await renderThresholdSettingsForm();
  const saveButton = await screen.findByTestId(THRESHOLD_SAVE_TEST_ID);
  const inputs = await screen.findAllByPlaceholderText('value');
  expect(saveButton).toBeInTheDocument();
  expect(inputs).toHaveLength(12);
});

test('has default values in form', async () => {
  const { user } = await renderThresholdSettingsForm();
  const upperLimitInputs = await screen.findAllByTestId(THRESHOLD_UPPER_LIMIT_TEST_ID);
  const lowerLimitInputs = await screen.findAllByTestId(THRESHOLD_LOWER_LIMIT_TEST_ID);
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
  const saveButton = await screen.findByTestId(THRESHOLD_SAVE_TEST_ID);
  await user.click(saveButton);

  const { body } = await read();
  expect(body).toEqual({ thresholds: TENANT_SETTINGS.thresholds });
});
