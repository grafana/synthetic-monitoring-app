import React from 'react';
import { screen } from '@testing-library/react';
import { render } from 'test/render';

import { ConfigActions } from 'components/ConfigActions';

const renderConfigActions = ({ hasApi = true, enabled = true } = {}) => {
  const instance = hasApi ? undefined : { api: undefined };

  return render(<ConfigActions enabled={enabled} pluginId="steve" />, { instance });
};

it('shows disable option when activated', async () => {
  await renderConfigActions();
  const disableButton = await screen.findByRole('button', { name: 'Disable synthetic monitoring' });
  expect(disableButton).toBeInTheDocument();
});

it('shows enable action when disabled', async () => {
  await renderConfigActions({ hasApi: false, enabled: false });
  const enableButton = await screen.findByRole('button', { name: 'Enable plugin' });
  expect(enableButton).toBeInTheDocument();
});

it('shows setup action when not intialized', async () => {
  await renderConfigActions({ hasApi: false });
  const setupButton = await screen.findByRole('button', { name: 'Setup' });
  expect(setupButton).toBeInTheDocument();
});
