import React from 'react';
import { screen } from '@testing-library/react';
import { SM_DATASOURCE } from 'test/fixtures/datasources';
import { type CustomRenderOptions, render } from 'test/render';

import { ROUTES } from 'types';
import { InitialisedRouter, UninitialisedRouter } from 'routing/Routers';
import { getRoute } from 'routing/utils';
import { PLUGIN_URL_PATH } from 'components/Routing.consts';

function renderInitialisedRouting(options?: CustomRenderOptions) {
  return render(<InitialisedRouter />, options);
}

function renderUninitialisedRouting(options?: CustomRenderOptions) {
  render(<UninitialisedRouter />, options);
}

// Mocking these pages because they renders scenes, which makes jest explode
jest.mock('page/DashboardPage');
jest.mock('page/SceneHomepage');
const notaRoute = `${PLUGIN_URL_PATH}/404`;

describe('Renders specific welcome pages when app is not initializd', () => {
  test(`Route Home`, async () => {
    renderUninitialisedRouting({ path: getRoute(ROUTES.Home) });
    const text = await screen.findByText('Up and running in seconds, no instrumentation required');
    expect(text).toBeInTheDocument();
  });

  test(`Route Probes`, async () => {
    renderUninitialisedRouting({ path: getRoute(ROUTES.Probes) });
    const text = await screen.findByText(
      'Click the See Probes button to initialize the plugin and see a list of public probes',
      { exact: false }
    );
    expect(text).toBeInTheDocument();
  });

  test(`Route Alerts`, async () => {
    renderUninitialisedRouting({ path: getRoute(ROUTES.Alerts) });
    const text = await screen.findByText(
      'Click the See Alerting button to initialize the plugin and see a list of default alerts',
      { exact: false }
    );
    expect(text).toBeInTheDocument();
  });
  test(`Route Checks`, async () => {
    renderUninitialisedRouting({ path: getRoute(ROUTES.Checks) });
    const text = await screen.findByText('Click the Create a Check button to initialize the plugin and create checks', {
      exact: false,
    });
    expect(text).toBeInTheDocument();
  });

  test(`Route Config`, async () => {
    renderUninitialisedRouting({ path: getRoute(ROUTES.Config) });
    const text = await screen.findByText(/Plugin version:/);
    expect(text).toBeInTheDocument();
  });

  test('Non-existent route (404)', async () => {
    renderUninitialisedRouting({ path: notaRoute });
    const text = await screen.findByText('Up and running in seconds, no instrumentation required');
    expect(text).toBeInTheDocument();
  });
});

// Would like to have asserted on the h1s but rendering the Grafana pluginpage is tricky
describe('Routes to pages correctly', () => {
  test('Home page renders', async () => {
    renderInitialisedRouting({ path: getRoute(ROUTES.Home) });
    const homePageText = await screen.findByText('Home page', { selector: 'h1' });
    expect(homePageText).toBeInTheDocument();
  });
  test('Checks page renders', async () => {
    renderInitialisedRouting({ path: getRoute(ROUTES.Checks) });
    const checksButton = await screen.findByText('Add new check');
    expect(checksButton).toBeInTheDocument();
  });
  test('Probes page renders', async () => {
    renderInitialisedRouting({ path: getRoute(ROUTES.Probes) });
    const probeReachabilityTexts = await screen.findAllByText('Reachability');
    expect(probeReachabilityTexts.length).toBeGreaterThan(0);
  });
  test('Alert page renders', async () => {
    renderInitialisedRouting({ path: getRoute(ROUTES.Alerts) });
    const alertsText = await screen.findByText('Learn more about alerting for Synthetic Monitoring.');
    expect(alertsText).toBeInTheDocument();
  });
  test('Config page renders', async () => {
    renderInitialisedRouting({ path: getRoute(ROUTES.Config) });
    const configText = await screen.findByText(
      /Synthetic Monitoring is a blackbox monitoring solution provided as part of/i
    );
    expect(configText).toBeInTheDocument();
  });

  test(`Config page renders the initialized state`, async () => {
    renderInitialisedRouting({ path: getRoute(ROUTES.Config) });
    const withoutHttps = SM_DATASOURCE.jsonData.apiHost.replace('https://', '');
    const backendAddress = await screen.findByText(withoutHttps);
    expect(backendAddress).toBeInTheDocument();
  });

  test('Non-existent route shows 404 page', async () => {
    renderInitialisedRouting({ path: notaRoute });
    const homePageText = await screen.findByText('Not found', { selector: 'span' });
    const link = await screen.findByText('home', { selector: 'a' });
    expect(homePageText).toBeInTheDocument();
    expect(link).toBeInTheDocument();
  });

  test('Redirect old scenes URLS to new scenes URL', async () => {
    renderInitialisedRouting({
      path: `${PLUGIN_URL_PATH}${ROUTES.Scene}?var-job=Job name for http&var-instance=https://http.com`,
    });
    const sceneText = await screen.findByText('Dashboard page');
    expect(sceneText).toBeInTheDocument();
  });
});
