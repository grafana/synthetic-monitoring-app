import React from 'react';
import { render, screen } from '@testing-library/react';
import { ConfigActions } from 'components/ConfigActions';
import { InstanceContext } from 'contexts/InstanceContext';
import { getInstanceMock } from 'datasource/__mocks__/DataSource';
import { AppPluginMeta } from '@grafana/data';
import { GlobalSettings } from 'types';

const renderConfigActions = ({ hasApi = true, enabled = true } = {}) => {
  const instance = hasApi ? getInstanceMock() : undefined;
  const meta = {} as AppPluginMeta<GlobalSettings>;
  return render(
    <InstanceContext.Provider value={{ instance: { api: instance }, loading: false, meta }}>
      <ConfigActions enabled={enabled} pluginId="steve" />
    </InstanceContext.Provider>
  );
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
