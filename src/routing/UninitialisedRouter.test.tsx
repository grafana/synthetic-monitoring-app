import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { APP_INITIALIZER_TEST_ID } from 'test/dataTestIds';
import { LOGS_DATASOURCE, METRICS_DATASOURCE } from 'test/fixtures/datasources';
import { apiRoute, getServerRequests } from 'test/handlers';
import { type CustomRenderOptions, render } from 'test/render';
import { server } from 'test/server';
import { mockFeatureToggles, runTestAsSMViewer } from 'test/utils';

import { FeatureName } from 'types';
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

describe('Auto-initialization on check-creation deep-links', () => {
  // Aligns provisioned datasource names with the fixtures so the initializer reaches /install.
  const INIT_META = {
    jsonData: {
      metrics: { grafanaName: METRICS_DATASOURCE.name, hostedId: 4 },
      logs: { grafanaName: LOGS_DATASOURCE.name, hostedId: 8 },
      apiHost: 'https://synthetic-monitoring-api.grafana.net',
      stackId: 1,
    },
  };

  const apiEndpointPath = `${getRoute(AppRoutes.NewCheck)}/api-endpoint`;

  beforeEach(() => {
    // The auto-init success path calls window.location.reload(), which jsdom can't do.
    const original = console.error;
    jest.spyOn(console, 'error').mockImplementation((...args) => {
      const message = typeof args[0] === 'string' ? args[0] : (args[0] as Error)?.message;
      if (!message?.includes('Not implemented: navigation')) {
        original(...args);
      }
    });
  });

  test('auto-initializes (no manual button) when landing on the API endpoint creation page with the flag on', async () => {
    mockFeatureToggles({ [FeatureName.AutoInitializeOnUrl]: true });
    const { record, requests } = getServerRequests();
    server.use(apiRoute('installPlugin', {}, record));

    renderUninitialisedRouting({ path: apiEndpointPath, meta: INIT_META });

    expect(await screen.findByTestId(APP_INITIALIZER_TEST_ID.autoInitSpinner)).toBeInTheDocument();
    expect(screen.queryByTestId(APP_INITIALIZER_TEST_ID.initButton)).not.toBeInTheDocument();

    await waitFor(() => expect(requests.length).toBeGreaterThan(0));
  });

  test('auto-initializes when landing on the check-type picker with the flag on', async () => {
    mockFeatureToggles({ [FeatureName.AutoInitializeOnUrl]: true });
    const { record, requests } = getServerRequests();
    server.use(apiRoute('installPlugin', {}, record));

    renderUninitialisedRouting({ path: getRoute(AppRoutes.ChooseCheckGroup), meta: INIT_META });

    await waitFor(() => expect(requests.length).toBeGreaterThan(0));
  });

  test('does not auto-initialize and redirects to the home welcome page when the flag is off', async () => {
    const { record, requests } = getServerRequests();
    server.use(apiRoute('installPlugin', {}, record));

    renderUninitialisedRouting({ path: apiEndpointPath, meta: INIT_META });

    expect(
      await screen.findByText('Up and running in seconds, no instrumentation required')
    ).toBeInTheDocument();
    expect(requests).toHaveLength(0);
  });

  test('shows the contact-admin alert and does not initialize when the user lacks permissions', async () => {
    mockFeatureToggles({ [FeatureName.AutoInitializeOnUrl]: true });
    runTestAsSMViewer();
    const { record, requests } = getServerRequests();
    server.use(apiRoute('installPlugin', {}, record));

    renderUninitialisedRouting({ path: apiEndpointPath, meta: INIT_META });

    expect(await screen.findByText(/Contact your administrator/)).toBeInTheDocument();
    expect(requests).toHaveLength(0);
  });
});
