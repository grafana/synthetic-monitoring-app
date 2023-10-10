import React from 'react';
import { screen, waitFor, act } from '@testing-library/react';
import { MemoryRouter, Route } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { FeatureToggles } from '@grafana/data';

import { ROUTES } from 'types';
import { render } from 'test/render';
import { CheckRouter } from './CheckRouter';
import { PLUGIN_URL_PATH } from 'components/constants';
import { FeatureFlagProvider } from 'components/FeatureFlagProvider';

jest.setTimeout(20000);

const renderChecksPage = (multiHttpEnabled = false) => {
  const featureToggles = { 'multi-http': multiHttpEnabled } as unknown as FeatureToggles;
  const isFeatureEnabled = jest.fn(() => multiHttpEnabled);

  render(
    <FeatureFlagProvider overrides={{ featureToggles, isFeatureEnabled }}>
      <MemoryRouter initialEntries={[`${PLUGIN_URL_PATH}${ROUTES.Checks}`]}>
        <Route path={`${PLUGIN_URL_PATH}${ROUTES.Checks}`}>
          <CheckRouter />
        </Route>
      </MemoryRouter>
    </FeatureFlagProvider>
  );
};

test('renders checks', async () => {
  renderChecksPage();
  await waitFor(() => expect(screen.getByText('a jobname')).toBeInTheDocument());
});

test('renders check selection page with multi-http feature flag is ON', async () => {
  renderChecksPage(true);
  await waitFor(() => screen.getByRole('button', { name: 'Add new check' }));
  act(() => userEvent.click(screen.getByRole('button', { name: 'Add new check' })));
  expect(await screen.findByRole('button', { name: 'HTTP' })).toBeInTheDocument();
  expect(await screen.findByRole('button', { name: 'MULTIHTTP' })).toBeInTheDocument();
  expect(await screen.findByRole('button', { name: 'Traceroute' })).toBeInTheDocument();
  expect(await screen.findByRole('button', { name: 'PING' })).toBeInTheDocument();
  expect(await screen.findByRole('button', { name: 'DNS' })).toBeInTheDocument();
});

test('renders check selection page without multi-http feature flag is OFF', async () => {
  renderChecksPage(false);
  await waitFor(() => screen.getByRole('button', { name: 'Add new check' }));
  act(() => userEvent.click(screen.getByRole('button', { name: 'Add new check' })));
  expect(await screen.queryByRole('button', { name: 'HTTP' })).toBeInTheDocument();
  expect(await screen.queryByRole('button', { name: 'Traceroute' })).toBeInTheDocument();
  expect(await screen.queryByRole('button', { name: 'PING' })).toBeInTheDocument();
  expect(await screen.queryByRole('button', { name: 'DNS' })).toBeInTheDocument();
  expect(await screen.queryByRole('button', { name: 'MULTIHTTP' })).not.toBeInTheDocument();
});

test('renders check editor existing check', async () => {
  renderChecksPage();
  const edit = await screen.findByTestId('edit-check-button');
  userEvent.click(edit);
  await waitFor(() => expect(screen.getByText('Editing a jobname')).toBeInTheDocument());
});
