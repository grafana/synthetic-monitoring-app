import React from 'react';
import runTime from '@grafana/runtime';
import { screen } from '@testing-library/react';
import { type CustomRenderOptions, render } from 'test/render';

import { ROUTES } from 'types';

import { PLUGIN_URL_PATH } from './constants';
import { getRoute, Routing } from './Routing';

function renderRouting(options?: CustomRenderOptions) {
  return render(<Routing onNavChanged={jest.fn} />, options);
}

// Mocking these pages because they renders scenes, which makes jest explode
jest.mock('page/DashboardPage');
jest.mock('page/SceneHomepage');
const notaRoute = `${PLUGIN_URL_PATH}/404`;

describe('Only renders the unprovisioned setup page regardless of route when app is not provisioned', () => {
  Object.entries(ROUTES).map(([key, route]) => {
    test(`Route ${key}`, async () => {
      renderRouting({ path: getRoute(route), meta: { jsonData: undefined } });
      const text = await screen.findByText('Provisioning is required for Synthetic Monitoring.');
      expect(text).toBeInTheDocument();
    });
  });

  test('Non-existent route (404)', async () => {
    renderRouting({ path: notaRoute, meta: { jsonData: undefined } });
    const text = await screen.findByText('Provisioning is required for Synthetic Monitoring.');
    expect(text).toBeInTheDocument();
  });
});

describe('Only renders the welcome page regardless of route when app is not initializd', () => {
  Object.entries(ROUTES).map(([key, route]) => {
    test(`Route ${key}`, async () => {
      jest.spyOn(runTime, `getDataSourceSrv`).mockImplementation(() => {
        return {
          ...jest.requireActual('@grafana/runtime').getDataSourceSrv(),
          get: () => Promise.resolve(),
        };
      });

      renderRouting({ path: getRoute(route) });
      const text = await screen.findByText('Ready to start using synthetic monitoring?');
      expect(text).toBeInTheDocument();
    });
  });

  test('Non-existent route (404)', async () => {
    jest.spyOn(runTime, `getDataSourceSrv`).mockImplementation(() => {
      return {
        ...jest.requireActual('@grafana/runtime').getDataSourceSrv(),
        get: () => Promise.resolve(),
      };
    });

    renderRouting({ path: notaRoute });
    const text = await screen.findByText('Ready to start using synthetic monitoring?');
    expect(text).toBeInTheDocument();
  });
});

// Would like to have asserted on the h1s but rendering the Grafana pluginpage is tricky
describe('Routes to pages correctly', () => {
  test('Home page renders', async () => {
    renderRouting({ path: getRoute(ROUTES.Home) });
    const homePageText = await screen.findByText('Home page', { selector: 'h1' });
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
    const homePageText = await screen.findByText('Home page', { selector: 'h1' });
    expect(homePageText).toBeInTheDocument();
  });

  test('Redirect old scenes URLS to new scenes URL', async () => {
    renderRouting({
      path: `${PLUGIN_URL_PATH}${ROUTES.Scene}?var-job=Job name for http&var-instance=https://http.com`,
    });
    const sceneText = await screen.findByText('Dashboard page');
    expect(sceneText).toBeInTheDocument();
  });
});
