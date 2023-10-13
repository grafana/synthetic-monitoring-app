import React from 'react';
import { screen } from '@testing-library/react';

import { type CustomRenderOptions, createInstance, render } from 'test/render';
import { getRoute, Routing } from './Routing';
import { ROUTES } from 'types';

function renderRouting(options?: CustomRenderOptions) {
  return render(<Routing onNavChanged={jest.fn} />, options);
}

describe('Only renders the unprovisioned setup page regardless of route when app is not provisioned', () => {
  Object.entries(ROUTES).map(([key, route]) => {
    test(`Route ${key}`, () => {
      renderRouting({ path: getRoute(route), meta: { jsonData: undefined } });
      screen.getByText('Provisioning is required for Synthetic Monitoring.');
    });
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
});

// Would like to find the h1s but rendering the Grafana pluginpage is tricky
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
});
