import React from 'react';
import { screen, waitForElementToBeRemoved } from '@testing-library/react';
import { BASIC_DNS_CHECK, BASIC_HTTP_CHECK } from 'test/fixtures/checks';
import { apiRoute } from 'test/handlers';
import { render } from 'test/render';
import { server } from 'test/server';

import { AppRoutes } from 'routing/types';
import { generateRoutePath } from 'routing/utils';

import { CheckList } from './CheckList';

const renderCheckList = async (checks = [BASIC_DNS_CHECK, BASIC_HTTP_CHECK], searchParams = '') => {
  server.use(
    apiRoute(`listChecks`, {
      result: () => {
        return {
          json: checks,
        };
      },
    })
  );

  const path = `${generateRoutePath(AppRoutes.Checks)}?${searchParams}`;

  const res = render(<CheckList />, {
    route: AppRoutes.Checks,
    path,
  });

  expect(await screen.findByText('Add new check')).toBeInTheDocument();
  return res;
};

describe('CheckList - Search Functionality', () => {
  test('search by text', async () => {
    const { user } = await renderCheckList();
    const filterInput = await screen.findByPlaceholderText('Search by job name, endpoint, or label');
    filterInput.focus();

    await user.paste(BASIC_DNS_CHECK.job);
    const willBeRemoved = screen.getByText(BASIC_HTTP_CHECK.job);
    await waitForElementToBeRemoved(willBeRemoved, { timeout: 1500 });
    const checks = await screen.findAllByTestId('check-card');
    expect(checks.length).toBe(1);
  });

  test('search is case insensitive', async () => {
    const { user } = await renderCheckList();
    const filterInput = await screen.findByPlaceholderText('Search by job name, endpoint, or label');
    const willBeRemoved = screen.getByText(BASIC_HTTP_CHECK.job);
    filterInput.focus();

    await user.paste(BASIC_DNS_CHECK.job.toUpperCase());
    await waitForElementToBeRemoved(willBeRemoved, { timeout: 1500 });
    const checks = await screen.findAllByTestId('check-card');
    expect(checks.length).toBe(1);
  });

  test('search matches target value', async () => {
    const { user } = await renderCheckList();
    const filterInput = await screen.findByPlaceholderText('Search by job name, endpoint, or label');
    const willBeRemoved = screen.getByText(BASIC_HTTP_CHECK.job);
    filterInput.focus();

    await user.paste(BASIC_DNS_CHECK.target);
    await waitForElementToBeRemoved(willBeRemoved, { timeout: 1500 });
    const checks = await screen.findAllByTestId('check-card');
    expect(checks.length).toBe(1);
  });

  test('search matches label name', async () => {
    const { user } = await renderCheckList();
    const filterInput = await screen.findByPlaceholderText('Search by job name, endpoint, or label');
    const willBeRemoved = screen.getByText(BASIC_HTTP_CHECK.job);
    filterInput.focus();

    await user.paste(BASIC_DNS_CHECK.labels[0].name);
    await waitForElementToBeRemoved(willBeRemoved, { timeout: 1500 });
    const checks = await screen.findAllByTestId('check-card');
    expect(checks.length).toBe(1);
  });

  test('search matches label value', async () => {
    const { user } = await renderCheckList();
    const filterInput = await screen.findByPlaceholderText('Search by job name, endpoint, or label');
    const willBeRemoved = screen.getByText(BASIC_HTTP_CHECK.job);
    filterInput.focus();

    await user.paste(BASIC_DNS_CHECK.labels[0].value);
    await waitForElementToBeRemoved(willBeRemoved, { timeout: 1500 });
    const checks = await screen.findAllByTestId('check-card');
    expect(checks.length).toBe(1);
  });

  test('loads search from query params', async () => {
    await renderCheckList([BASIC_DNS_CHECK, BASIC_HTTP_CHECK], `search=${BASIC_DNS_CHECK.job}`);
    const searchInput = await screen.findByPlaceholderText('Search by job name, endpoint, or label');
    expect(searchInput).toHaveValue(BASIC_DNS_CHECK.job);

    const checks = await screen.findAllByTestId('check-card');
    expect(checks.length).toBe(1);
  });
});
