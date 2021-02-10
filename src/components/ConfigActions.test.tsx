import React from 'react';
import { render, screen } from '@testing-library/react';
import { ConfigActions } from 'components/ConfigActions';
import { InstanceContext } from 'components/InstanceContext';
import { getInstanceMock } from 'datasource/__mocks__/DataSource';
import { AppPluginMeta } from '@grafana/data';
import { GlobalSettings } from 'types';

const renderConfigActions = ({ hasApi = true } = {}) => {
  const instance = hasApi ? getInstanceMock() : undefined;
  const meta = {} as AppPluginMeta<GlobalSettings>;
  return render(
    <InstanceContext.Provider value={{ instance: { api: instance }, loading: false, meta }}>
      <ConfigActions />
    </InstanceContext.Provider>
  );
};

it('shows disable option when activated', async () => {
  await renderConfigActions();
  const disableButton = await screen.findByRole('button', { name: 'Disable synthetic monitoring' });
  expect(disableButton).toBeInTheDocument();
});

it('shows setup action when disabled', async () => {
  await renderConfigActions({ hasApi: false });
  const setupButton = await screen.findByRole('button', { name: 'Setup' });
  expect(setupButton).toBeInTheDocument();
});
