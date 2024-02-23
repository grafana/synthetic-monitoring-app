import React from 'react';
import runTime from '@grafana/runtime';
import { screen } from '@testing-library/react';
import { render } from 'test/render';

import { ConfigActions } from 'components/ConfigActions';

it('shows disable option when activated', async () => {
  render(<ConfigActions enabled={true} pluginId="steve" />);

  const disableButton = await screen.findByRole('button', { name: 'Disable synthetic monitoring' });
  expect(disableButton).toBeInTheDocument();
});

it('shows enable action when disabled', async () => {
  jest.spyOn(runTime, `getDataSourceSrv`).mockImplementation(() => {
    return {
      ...jest.requireActual('@grafana/runtime').getDataSourceSrv(),
      get: () => Promise.resolve(),
    };
  });

  render(<ConfigActions enabled={false} pluginId="steve" />);

  const enableButton = await screen.findByRole('button', { name: 'Enable plugin' });
  expect(enableButton).toBeInTheDocument();
});

it('shows setup action when not intialized', async () => {
  jest.spyOn(runTime, `getDataSourceSrv`).mockImplementation(() => {
    return {
      ...jest.requireActual('@grafana/runtime').getDataSourceSrv(),
      get: () => Promise.resolve(),
    };
  });

  render(<ConfigActions enabled={true} pluginId="steve" />);
  const setupButton = await screen.findByRole('button', { name: 'Setup' });
  expect(setupButton).toBeInTheDocument();
});
