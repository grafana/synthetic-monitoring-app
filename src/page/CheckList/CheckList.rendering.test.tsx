import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { DataTestIds } from 'test/dataTestIds';
import { BASIC_CHECK_LIST, BASIC_DNS_CHECK, BASIC_HTTP_CHECK } from 'test/fixtures/checks';
import { apiRoute } from 'test/handlers';
import { render } from 'test/render';
import { server } from 'test/server';

import { AppRoutes } from 'routing/types';
import { generateRoutePath } from 'routing/utils';

import { CheckList } from './CheckList';

jest.mock('hooks/useNavigation', () => {
  const actual = jest.requireActual('hooks/useNavigation');
  return {
    __esModule: true,
    ...actual,
  };
});
const useNavigationHook = require('hooks/useNavigation');

const renderCheckList = async (checks = BASIC_CHECK_LIST, searchParams = '') => {
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

describe('CheckList - Rendering', () => {
  test('renders empty state', async () => {
    server.use(
      apiRoute(`listChecks`, {
        result: () => {
          return {
            json: [],
          };
        },
      })
    );

    render(<CheckList />);

    const emptyWarning = await waitFor(
      () =>
        screen.findByTestId(DataTestIds.CHECKS_EMPTY_STATE, {
          exact: false,
        }),
      { timeout: 30000 }
    );

    expect(emptyWarning).toBeInTheDocument();
  });

  test('renders list of checks', async () => {
    await renderCheckList();
    const checks = await screen.findAllByTestId('check-card');
    expect(checks.length).toBe(BASIC_CHECK_LIST.length);
  });

  test('clicking add new is handled', async () => {
    const navigate = jest.fn();
    useNavigationHook.useNavigation = jest.fn(() => navigate); // TODO: COME BACK TO
    const { user } = await renderCheckList();
    const addNewButton = await screen.findByText('Add new check');
    await user.click(addNewButton);
    expect(navigate).toHaveBeenCalledWith(AppRoutes.ChooseCheckGroup);
  });

  test('loads sorting type in ascending order from query params', async () => {
    const searchParams = `sort=atoz`;
    await renderCheckList([BASIC_DNS_CHECK, BASIC_HTTP_CHECK], searchParams);
    await screen.findByText('Sort');
    const sortValue = await screen.findByText('A-Z');
    expect(sortValue).toBeInTheDocument();

    const checks = await screen.findAllByTestId('check-card');
    expect(checks.length).toBe(2);
    expect(checks[0]).toHaveTextContent(BASIC_DNS_CHECK.job);
    expect(checks[1]).toHaveTextContent(BASIC_HTTP_CHECK.job);
  });

  test('loads sorting type in descending order from query params', async () => {
    const searchParams = `sort=ztoa`;
    await renderCheckList([BASIC_DNS_CHECK, BASIC_HTTP_CHECK], searchParams);
    await screen.findByText('Sort');
    const sortInput = await screen.findByText(/Z-A/i);
    expect(sortInput).toBeInTheDocument();

    const checks = await screen.findAllByTestId('check-card');
    expect(checks.length).toBe(2);
    expect(checks[0]).toHaveTextContent(BASIC_HTTP_CHECK.job);
    expect(checks[1]).toHaveTextContent(BASIC_DNS_CHECK.job);
  });

  test('Sorting by success rate should not crash', async () => {
    const { user } = await renderCheckList();
    const sortPicker = screen.getByLabelText('Sort checks by');
    await user.click(sortPicker);
    await user.click(screen.getByText(`Asc. Reachability`, { selector: 'span' }));

    const checks = await waitFor(() => screen.findAllByTestId('check-card'), { timeout: 5000 });
    expect(checks.length).toBe(BASIC_CHECK_LIST.length);
  });
});
