import React from 'react';
import runtime from '@grafana/runtime';
import { screen, waitFor } from '@testing-library/react';
import { BASIC_CHECK_LIST, BASIC_PING_CHECK } from 'test/fixtures/checks';
import { render } from 'test/render';

import { ROUTES } from 'types';
import { PLUGIN_URL_PATH } from 'components/constants';

import { CheckRouter } from './CheckRouter';

jest.setTimeout(20000);

const renderChecksPage = () => {
  return render(<CheckRouter />, {
    path: `${PLUGIN_URL_PATH}${ROUTES.Checks}`,
    route: `${PLUGIN_URL_PATH}${ROUTES.Checks}`,
  });
};

test('renders checks', async () => {
  await renderChecksPage();
  await waitFor(() => expect(screen.getByText(BASIC_PING_CHECK.job)).toBeInTheDocument());
});

test('renders check selection page with multi-http feature flag is ON', async () => {
  const { user } = await renderChecksPage();
  await waitFor(() => screen.getByRole('button', { name: 'Add new check' }));
  await user.click(screen.getByRole('button', { name: 'Add new check' }));
  expect(await screen.findByRole('button', { name: 'HTTP' })).toBeInTheDocument();
  expect(await screen.findByRole('button', { name: /MULTIHTTP/ })).toBeInTheDocument();
  expect(await screen.findByRole('button', { name: 'Traceroute' })).toBeInTheDocument();
  expect(await screen.findByRole('button', { name: 'PING' })).toBeInTheDocument();
  expect(await screen.findByRole('button', { name: 'DNS' })).toBeInTheDocument();
});

test('renders check selection page without multi-http feature flag is OFF', async () => {
  jest.replaceProperty(runtime, `config`, {
    ...runtime.config,
    featureToggles: {
      // @ts-expect-error
      configFlag: { 'multi-http': false },
    },
  });

  const { user } = await renderChecksPage();
  await waitFor(() => screen.getByRole('button', { name: 'Add new check' }));
  await user.click(screen.getByRole('button', { name: 'Add new check' }));
  expect(await screen.queryByRole('button', { name: 'HTTP' })).toBeInTheDocument();
  expect(await screen.queryByRole('button', { name: 'Traceroute' })).toBeInTheDocument();
  expect(await screen.queryByRole('button', { name: 'PING' })).toBeInTheDocument();
  expect(await screen.queryByRole('button', { name: 'DNS' })).toBeInTheDocument();
  expect(await screen.queryByRole('button', { name: /MULTIHTTP/ })).not.toBeInTheDocument();
});

test('renders check editor existing check', async () => {
  const { user } = await renderChecksPage();
  const editButtons = await screen.findAllByTestId('edit-check-button');
  const sortedBasicCheckList = BASIC_CHECK_LIST.sort((a, b) => a.job.localeCompare(b.job));
  const checkToEdit = 3;

  await user.click(editButtons[checkToEdit]);
  await waitFor(() => expect(screen.getByText(`Editing ${sortedBasicCheckList[checkToEdit].job}`)).toBeInTheDocument());
});
