import React from 'react';
import { screen } from '@testing-library/react';
import { type CustomRenderOptions, render } from 'test/render';

import { PLUGIN_URL_PATH } from 'routing/constants';
import { AppRoutes } from 'routing/types';
import { UninitialisedRouter } from 'routing/UninitialisedRouter';
import { getRoute } from 'routing/utils';

function renderUninitialisedRouting(options?: CustomRenderOptions) {
  render(<UninitialisedRouter />, options);
}

const notaRoute = `${PLUGIN_URL_PATH}/404`;

describe('Renders specific welcome pages when app is not initializd', () => {
  test(`Route Home`, async () => {
    renderUninitialisedRouting({ path: getRoute(AppRoutes.Home) });
    const text = await screen.findByText('Up and running in seconds, no instrumentation required');
    expect(text).toBeInTheDocument();
  });

  test(`Route Probes`, async () => {
    renderUninitialisedRouting({ path: getRoute(AppRoutes.Probes) });
    const text = await screen.findByText(
      'Click the See Probes button to initialize the plugin and see a list of public probes',
      { exact: false }
    );
    expect(text).toBeInTheDocument();
  });

  test(`Route Alerts`, async () => {
    renderUninitialisedRouting({ path: getRoute(AppRoutes.Alerts) });
    const text = await screen.findByText(
      'Click the See Alerting button to initialize the plugin and see a list of default alerts',
      { exact: false }
    );
    expect(text).toBeInTheDocument();
  });
  test(`Route Checks`, async () => {
    renderUninitialisedRouting({ path: getRoute(AppRoutes.Checks) });
    const text = await screen.findByText('Click the Create a Check button to initialize the plugin and create checks', {
      exact: false,
    });
    expect(text).toBeInTheDocument();
  });

  test(`Route Config`, async () => {
    renderUninitialisedRouting({ path: getRoute(AppRoutes.Config) });

    const text = await screen.findByText('Synthetic Monitoring is not yet initialized');
    expect(text).toBeInTheDocument();
  });

  test('Non-existent route (404)', async () => {
    renderUninitialisedRouting({ path: notaRoute });
    const text = await screen.findByText('Up and running in seconds, no instrumentation required');
    expect(text).toBeInTheDocument();
  });
});
