import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { BASIC_CHECK_LIST, BASIC_DNS_CHECK, BASIC_HTTP_CHECK, BASIC_TCP_CHECK, BASIC_TRACEROUTE_CHECK } from 'test/fixtures/checks';
import { apiRoute, getServerRequests } from 'test/handlers';
import { render } from 'test/render';
import { server } from 'test/server';

import { AppRoutes } from 'routing/types';
import { generateRoutePath } from 'routing/utils';

import { CheckList } from './CheckList';

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

describe('CheckList - Bulk Actions', () => {
  test('select all performs disable action on all visible checks', async () => {
    const { read, record } = getServerRequests();
    server.use(apiRoute(`bulkUpdateChecks`, {}, record));

    const checkList = [BASIC_DNS_CHECK, BASIC_HTTP_CHECK];
    const { user } = await renderCheckList(checkList);
    const selectAll = await screen.findByTestId('selectAll');
    await user.click(selectAll);
    const selectedText = await screen.findByText(`${checkList.length} checks are selected.`);
    expect(selectedText).toBeInTheDocument();
    const disableButton = await screen.findByText('Disable');

    await user.click(disableButton);

    const { body } = await read();

    expect(body).toEqual(
      [BASIC_DNS_CHECK, BASIC_HTTP_CHECK].map((check) => ({
        ...check,
        enabled: false,
      }))
    );
  });

  test('select all performs enable action on all visible checks', async () => {
    const { read, record } = getServerRequests();
    server.use(apiRoute(`bulkUpdateChecks`, {}, record));

    const checkList = [BASIC_DNS_CHECK, BASIC_HTTP_CHECK].map((check) => ({
      ...check,
      enabled: false,
    }));
    const { user } = await renderCheckList(checkList);
    const selectAll = await screen.findByTestId('selectAll');
    await user.click(selectAll);
    const selectedText = await screen.findByText(`${checkList.length} checks are selected.`);
    expect(selectedText).toBeInTheDocument();
    const enableButton = await screen.findByText('Enable');
    await user.click(enableButton);

    const { body } = await read();

    expect(body).toEqual([BASIC_DNS_CHECK, BASIC_HTTP_CHECK]);
  });

  test('deselect all works correctly', async () => {
    const { user } = await renderCheckList();
    const selectAll = await screen.findByLabelText('Select all');
    await user.click(selectAll);

    const checkedCheckBoxes = await screen.findAllByLabelText('Select check');
    checkedCheckBoxes.forEach((checkbox) => {
      expect(checkbox).toBeChecked();
    });

    const selectedText = await screen.findByText(`${BASIC_CHECK_LIST.length} checks are selected.`);
    expect(selectedText).toBeInTheDocument();

    const deselectAll = await screen.findByLabelText('Select all');
    await user.click(deselectAll);
    const unCheckedCheckBoxes = await screen.findAllByLabelText('Select check');

    unCheckedCheckBoxes.forEach((checkbox) => {
      expect(checkbox).not.toBeChecked();
    });
  });

  test('indeterminate state works correctly', async () => {
    const { user } = await renderCheckList();
    const selectAll = await screen.findByLabelText('Select all');
    await user.click(selectAll);

    const checkedCheckBoxes = await screen.findAllByLabelText('Select check');
    await user.click(checkedCheckBoxes[0]);

    const indeterminateState = await screen.findByLabelText('Select all');
    expect(indeterminateState).toBePartiallyChecked();

    await user.click(selectAll);

    checkedCheckBoxes.forEach((checkbox) => {
      expect(checkbox).toBeChecked();
    });
  });

  test(`bulk select is disabled when no checks are rendered because of an empty search`, async () => {
    const { user } = await renderCheckList();
    const searchInput = await screen.findByLabelText('Search checks');
    const selectAll = await screen.findByLabelText('Select all');
    await user.click(selectAll);
    expect(selectAll).toBeChecked();

    searchInput.focus();
    await user.paste('non-existent-check');

    await waitFor(() => expect(selectAll).toBeDisabled(), { timeout: 5000 });
    expect(selectAll).not.toBeChecked();
  });

  test(`bulk selected items are reduced when a filter is added`, async () => {
    const { read, record } = getServerRequests();
    server.use(apiRoute(`bulkUpdateChecks`, {}, record));
    const { user } = await renderCheckList([BASIC_DNS_CHECK, BASIC_HTTP_CHECK]);

    const selectAll = await screen.findByLabelText('Select all');
    await user.click(selectAll);
    expect(selectAll).toBeChecked();

    await user.click(screen.getByText('HTTP'));
    expect(selectAll).toBePartiallyChecked();

    const enableButton = await screen.getByText('Disable');
    await user.click(enableButton);

    const { body } = await read();

    expect(body).toEqual(
      [BASIC_HTTP_CHECK].map((check) => ({
        ...check,
        enabled: false,
      }))
    );
  });

  test(`Displays check execution frequency`, async () => {
    await renderCheckList([BASIC_TCP_CHECK, BASIC_TRACEROUTE_CHECK]);
    const checks = await screen.findAllByTestId('check-card');

    expect(checks.length).toBe(2);
    expect(checks[0]).toHaveTextContent(`89280 executions / month`);
    expect(checks[1]).toHaveTextContent(`44640 executions / month`);
  });

  test(`Sorts by check execution frequency`, async () => {
    const { user } = await renderCheckList([BASIC_TCP_CHECK, BASIC_TRACEROUTE_CHECK]);
    const checksA = await screen.findAllByTestId('check-card');

    expect(checksA.length).toBe(2);
    expect(checksA[0]).toHaveTextContent(`89280 executions / month`);
    expect(checksA[1]).toHaveTextContent(`44640 executions / month`);

    const sortPicker = await screen.getByLabelText('Sort checks by');
    await user.click(sortPicker);
    await user.click(screen.getByText(`Asc. Executions`, { selector: 'span' }));

    const checksB = await screen.findAllByTestId('check-card');
    expect(checksB.length).toBe(2);

    expect(checksB[0]).toHaveTextContent(`44640 executions / month`);
    expect(checksB[1]).toHaveTextContent(`89280 executions / month`);

    await user.click(sortPicker);
    await user.click(screen.getByText(`Desc. Executions`, { selector: 'span' }));

    const checksC = await screen.findAllByTestId('check-card');
    expect(checksC.length).toBe(2);
    expect(checksC[0]).toHaveTextContent(`89280 executions / month`);
    expect(checksC[1]).toHaveTextContent(`44640 executions / month`);
  });
});
