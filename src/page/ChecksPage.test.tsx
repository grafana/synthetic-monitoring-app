import React from 'react';
import { screen, waitFor } from '@testing-library/react';

import { ROUTES } from 'types';
import { render } from 'test/render';
import { CheckRouter } from './CheckRouter';
import { PLUGIN_URL_PATH } from 'components/constants';

jest.setTimeout(20000);

const renderChecksPage = (multiHttpEnabled = false) => {
  const featureToggles = { 'multi-http': multiHttpEnabled };

  return render(<CheckRouter />, {
    featureToggles,
    path: `${PLUGIN_URL_PATH}${ROUTES.Checks}`,
    route: `${PLUGIN_URL_PATH}${ROUTES.Checks}`,
  });
};

test('renders checks', async () => {
  renderChecksPage();
  await waitFor(() => expect(screen.getByText('a jobname')).toBeInTheDocument());
});

test('renders check selection page with multi-http feature flag is ON', async () => {
  const { user } = renderChecksPage(true);
  await waitFor(() => screen.getByRole('button', { name: 'Add new check' }));
  await user.click(screen.getByRole('button', { name: 'Add new check' }));
  expect(await screen.findByRole('button', { name: 'HTTP' })).toBeInTheDocument();
  expect(await screen.findByRole('button', { name: 'MULTIHTTP' })).toBeInTheDocument();
  expect(await screen.findByRole('button', { name: 'Traceroute' })).toBeInTheDocument();
  expect(await screen.findByRole('button', { name: 'PING' })).toBeInTheDocument();
  expect(await screen.findByRole('button', { name: 'DNS' })).toBeInTheDocument();
});

test('renders check selection page without multi-http feature flag is OFF', async () => {
  const { user } = renderChecksPage(false);
  await waitFor(() => screen.getByRole('button', { name: 'Add new check' }));
  await user.click(screen.getByRole('button', { name: 'Add new check' }));
  expect(await screen.queryByRole('button', { name: 'HTTP' })).toBeInTheDocument();
  expect(await screen.queryByRole('button', { name: 'Traceroute' })).toBeInTheDocument();
  expect(await screen.queryByRole('button', { name: 'PING' })).toBeInTheDocument();
  expect(await screen.queryByRole('button', { name: 'DNS' })).toBeInTheDocument();
  expect(await screen.queryByRole('button', { name: 'MULTIHTTP' })).not.toBeInTheDocument();
});

test('renders check editor existing check', async () => {
  const { user } = renderChecksPage();
  const edit = await screen.findByTestId('edit-check-button');
  await user.click(edit);
  await waitFor(() => expect(screen.getByText('Editing a jobname')).toBeInTheDocument());
});
