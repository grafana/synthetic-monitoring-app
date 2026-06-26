import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { trackAutoInitialized, trackAutoInitializeFailed } from 'features/tracking/onboardingEvents';
import { APP_INITIALIZER_TEST_ID } from 'test/dataTestIds';
import { LOGS_DATASOURCE, METRICS_DATASOURCE } from 'test/fixtures/datasources';
import { apiRoute, getServerRequests } from 'test/handlers';
import { type CustomRenderOptions, render } from 'test/render';
import { server } from 'test/server';
import { runTestAsSMViewer } from 'test/utils';

import { PLUGIN_URL_PATH } from 'routing/constants';
import { AppRoutes } from 'routing/types';
import { UninitialisedRouter } from 'routing/UninitialisedRouter';
import { getRoute } from 'routing/utils';

jest.mock('features/tracking/onboardingEvents', () => ({
  trackAutoInitialized: jest.fn(),
  trackAutoInitializeFailed: jest.fn(),
}));

function renderUninitialisedRouting(options?: CustomRenderOptions) {
  render(<UninitialisedRouter />, options);
}

const notaRoute = `${PLUGIN_URL_PATH}/404`;

describe('Renders non-auto-initializing routes when app is not initialized', () => {
  test(`Route Home stays actionable (does not auto-initialize)`, async () => {
    const { requests } = getServerRequests();
    server.use(apiRoute('installPlugin', {}));

    renderUninitialisedRouting({ path: getRoute(AppRoutes.Home) });

    expect(await screen.findByText('Up and running in seconds, no instrumentation required')).toBeInTheDocument();
    expect(requests).toHaveLength(0);
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

describe('Auto-initialization on intent routes', () => {
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

  test('auto-initializes (no manual button) when landing on the API endpoint creation page', async () => {
    const { record, requests } = getServerRequests();
    server.use(apiRoute('installPlugin', {}, record));

    renderUninitialisedRouting({ path: apiEndpointPath, meta: INIT_META });

    expect(await screen.findByTestId(APP_INITIALIZER_TEST_ID.autoInitSpinner)).toBeInTheDocument();
    expect(screen.queryByTestId(APP_INITIALIZER_TEST_ID.initButton)).not.toBeInTheDocument();

    await waitFor(() => expect(requests.length).toBeGreaterThan(0));
  });

  test.each([
    ['check-type picker', AppRoutes.ChooseCheckGroup],
    ['probe creation page', AppRoutes.NewProbe],
    ['checks section', AppRoutes.Checks],
    ['probes section', AppRoutes.Probes],
    ['alerts section', AppRoutes.Alerts],
  ])('auto-initializes when landing on the %s', async (_label, route) => {
    const { record, requests } = getServerRequests();
    server.use(apiRoute('installPlugin', {}, record));

    renderUninitialisedRouting({ path: getRoute(route), meta: INIT_META });

    await waitFor(() => expect(requests.length).toBeGreaterThan(0));
  });

  test('tracks a successful auto-initialization with the route', async () => {
    renderUninitialisedRouting({ path: apiEndpointPath, meta: INIT_META });

    await waitFor(() =>
      expect(trackAutoInitialized).toHaveBeenCalledWith({ route: 'checks/new/api-endpoint' })
    );
  });

  test('shows the contact-admin alert and does not initialize when the user lacks permissions', async () => {
    runTestAsSMViewer();
    const { record, requests } = getServerRequests();
    server.use(apiRoute('installPlugin', {}, record));

    renderUninitialisedRouting({ path: apiEndpointPath, meta: INIT_META });

    expect(await screen.findByText(/Contact your administrator/)).toBeInTheDocument();
    expect(requests).toHaveLength(0);
  });

  test('surfaces an error with a retry button and tracks the failure when auto-init fails', async () => {
    server.use(apiRoute('installPlugin', { result: () => ({ status: 500 }) }));

    renderUninitialisedRouting({ path: apiEndpointPath, meta: INIT_META });

    expect(await screen.findByText('Something went wrong:')).toBeInTheDocument();
    expect(screen.getByTestId(APP_INITIALIZER_TEST_ID.initButton)).toBeInTheDocument();
    expect(screen.queryByTestId(APP_INITIALIZER_TEST_ID.autoInitSpinner)).not.toBeInTheDocument();

    await waitFor(() =>
      expect(trackAutoInitializeFailed).toHaveBeenCalledWith({
        route: 'checks/new/api-endpoint',
        reason: 'Something went wrong',
      })
    );
  });
});
