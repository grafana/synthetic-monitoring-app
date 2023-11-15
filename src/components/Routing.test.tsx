import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { createInstance, type CustomRenderOptions, render } from 'test/render';

import { ROUTES } from 'types';

import { PLUGIN_URL_PATH } from './constants';
import { getRoute, Routing } from './Routing';

function renderRouting(options?: CustomRenderOptions) {
  return waitFor(() => render(<Routing onNavChanged={jest.fn} />, options));
}

const notaRoute = `${PLUGIN_URL_PATH}/404`;

describe('Only renders the unprovisioned setup page regardless of route when app is not provisioned', () => {
  Object.entries(ROUTES).map(([key, route]) => {
    test(`Route ${key}`, async () => {
      renderRouting({ path: getRoute(route), meta: { jsonData: undefined } });
      screen.getByText('Provisioning is required for Synthetic Monitoring.');
    });
  });

  test('Non-existent route (404)', () => {
    renderRouting({ path: notaRoute, meta: { jsonData: undefined } });
    screen.getByText('Provisioning is required for Synthetic Monitoring.');
  });
});

describe('Only renders the welcome page regardless of route when app is not initializd', () => {
  Object.entries(ROUTES).map(([key, route]) => {
    test(`Route ${key}`, () => {
      const instance = createInstance({ api: undefined });
      renderRouting({ instance, path: getRoute(route) });
      screen.getByText('Ready to start using synthetic monitoring?');
    });
  });

  test('Non-existent route (404)', () => {
    const instance = createInstance({ api: undefined });
    renderRouting({ instance, path: notaRoute });
    screen.getByText('Ready to start using synthetic monitoring?');
  });
});

// Would like to have asserted on the h1s but rendering the Grafana pluginpage is tricky
describe('Routes to pages correctly', () => {
  test('Home page renders', async () => {
    renderRouting({ path: getRoute(ROUTES.Home) });
    const homePageText = await screen.findByText('What you can do', { selector: 'h2' });
    expect(homePageText).toBeInTheDocument();
  });

  test('Checks page renders', async () => {
    renderRouting({ path: getRoute(ROUTES.Checks) });
    const checksButton = await screen.findByText('Add new check');
    expect(checksButton).toBeInTheDocument();
  });

  test('Probes page renders', async () => {
    renderRouting({ path: getRoute(ROUTES.Probes) });
    const probeReachabilityTexts = await screen.findAllByText('Reachability');
    expect(probeReachabilityTexts.length).toBeGreaterThan(0);
  });

  test('Alert page renders', async () => {
    renderRouting({ path: getRoute(ROUTES.Alerts) });
    const alertsText = await screen.findByText('Learn more about alerting for Synthetic Monitoring.');
    expect(alertsText).toBeInTheDocument();
  });

  test('Config page renders', async () => {
    renderRouting({ path: getRoute(ROUTES.Config) });
    const configText = await screen.findByText(
      /Synthetic Monitoring is a blackbox monitoring solution provided as part of/i
    );
    expect(configText).toBeInTheDocument();
  });

  test('Non-existent route redirects to homepage', async () => {
    renderRouting({ path: notaRoute });
    const homePageText = await screen.findByText('What you can do', { selector: 'h2' });
    expect(homePageText).toBeInTheDocument();
  });
});
