import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { MemoryRouter, Route } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { CheckRouter } from './CheckRouter';
import { getInstanceMock } from 'datasource/__mocks__/DataSource';
import { InstanceContext } from 'contexts/InstanceContext';
import { AppPluginMeta, FeatureToggles } from '@grafana/data';
import { GlobalSettings, ROUTES } from 'types';
import { PLUGIN_URL_PATH } from 'components/constants';
import { FeatureFlagProvider } from 'components/FeatureFlagProvider';

jest.setTimeout(20000);

const renderChecksPage = (multiHttpEnabled = false) => {
  const instance = getInstanceMock();
  const meta = {} as AppPluginMeta<GlobalSettings>;
  const featureToggles = { 'multi-http': multiHttpEnabled } as unknown as FeatureToggles;
  const isFeatureEnabled = jest.fn(() => multiHttpEnabled);

  render(
    <FeatureFlagProvider overrides={{ featureToggles, isFeatureEnabled }}>
      <MemoryRouter initialEntries={[`${PLUGIN_URL_PATH}${ROUTES.Checks}`]}>
        <Route path={`${PLUGIN_URL_PATH}${ROUTES.Checks}`}>
          <InstanceContext.Provider value={{ instance: { api: instance }, loading: false, meta }}>
            <CheckRouter />
          </InstanceContext.Provider>
        </Route>
      </MemoryRouter>
    </FeatureFlagProvider>
  );
};

test('renders checks', async () => {
  renderChecksPage();
  await waitFor(() => expect(screen.getByText('a jobname')).toBeInTheDocument());
});

test('renders check selection page if multi-http feature flag is ON', async () => {
  renderChecksPage(true);
  await waitFor(() => screen.getByRole('button', { name: 'Add new check' }));
  act(() => userEvent.click(screen.getByRole('button', { name: 'Add new check' })));
  expect(await screen.findByRole('button', { name: 'HTTP' })).toBeInTheDocument();
  expect(await screen.findByRole('button', { name: 'MULTI-HTTP' })).toBeInTheDocument();
  expect(await screen.findByRole('button', { name: 'Traceroute' })).toBeInTheDocument();
  expect(await screen.findByRole('button', { name: 'PING' })).toBeInTheDocument();
  expect(await screen.findByRole('button', { name: 'DNS' })).toBeInTheDocument();
});

test('doesnt render check selection page if multi-http feature flag is OFF', async () => {
  renderChecksPage(false);
  await waitFor(() => screen.getByRole('button', { name: 'Add new check' }));
  act(() => userEvent.click(screen.getByRole('button', { name: 'Add new check' })));
  expect(await screen.queryByRole('button', { name: 'HTTP' })).not.toBeInTheDocument();
  expect(await screen.queryByRole('button', { name: 'MULTI-HTTP' })).not.toBeInTheDocument();
  expect(await screen.queryByRole('button', { name: 'Traceroute' })).not.toBeInTheDocument();
  expect(await screen.queryByRole('button', { name: 'PING' })).not.toBeInTheDocument();
  expect(await screen.queryByRole('button', { name: 'DNS' })).not.toBeInTheDocument();
});

test('renders check editor existing check', async () => {
  renderChecksPage();
  const edit = await screen.findByTestId('edit-check-button');
  userEvent.click(edit);
  await waitFor(() => expect(screen.getByText('Edit Check')).toBeInTheDocument());
});
