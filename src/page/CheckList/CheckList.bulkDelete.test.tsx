import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { CHECKS_TEST_ID } from 'test/dataTestIds';
import { DB } from 'test/db';
import { BASIC_DNS_CHECK, BASIC_HTTP_CHECK } from 'test/fixtures/checks';
import { PRIVATE_PROBE, PUBLIC_PROBE } from 'test/fixtures/probes';
import { apiRoute, getServerRequests } from 'test/handlers';
import { render } from 'test/render';
import { server } from 'test/server';
import { mockFeatureToggles } from 'test/utils';

import { Check, CheckType, FeatureName } from 'types';
import { AppRoutes } from 'routing/types';
import { generateRoutePath } from 'routing/utils';
import { confirmBulkDelete, getDeleteConfirmationInput } from 'page/CheckList/__testHelpers__/bulkDelete';
import { CHECKS_PER_PAGE_CARD } from 'page/CheckList/CheckList.constants';
import { DELETE_CONFIRMATION_COUNT_THRESHOLD, DELETE_CONFIRMATION_TEXT } from 'page/CheckList/components/BulkActions.hooks';

import { CheckList } from './CheckList';

const TWO_CHECKS = [BASIC_DNS_CHECK, BASIC_HTTP_CHECK];

const buildChecks = (count: number): Check[] =>
  Array.from({ length: count }, (_, index) =>
    DB.check.build(
      {
        job: `Check ${String(index).padStart(2, '0')}`,
        target: `https://example-${index}.com`,
        probes: [PRIVATE_PROBE.id, PUBLIC_PROBE.id] as number[],
      },
      { transient: { type: CheckType.Http } }
    )
  );

// More than one card page holds, so "select all" and "select everything that
// matches the filters" are no longer the same thing.
const CHECKS_ACROSS_TWO_PAGES: Check[] = buildChecks(CHECKS_PER_PAGE_CARD + 5);

const renderCheckList = async (checks: Check[]) => {
  server.use(
    apiRoute(`listChecks`, { result: () => ({ json: checks }) }),
    apiRoute(`listProbes`, { result: () => ({ json: [PRIVATE_PROBE, PUBLIC_PROBE] }) })
  );

  const res = render(<CheckList />, {
    route: AppRoutes.Checks,
    path: generateRoutePath(AppRoutes.Checks),
  });

  expect(await screen.findByText('Create new check')).toBeInTheDocument();
  return res;
};

const selectAllAndOpenDeleteModal = async (checks: Check[]) => {
  const { user } = await renderCheckList(checks);

  await user.click(await screen.findByTestId(CHECKS_TEST_ID.header.selectAll));
  await user.click(await screen.findByRole('button', { name: 'Delete' }));

  return { user };
};

describe('CheckList - bulk delete confirmation', () => {
  it('deletes nothing until the confirmation word is typed', async () => {
    const { record, requests } = getServerRequests();
    server.use(apiRoute('deleteCheck', {}, record));

    const { user } = await selectAllAndOpenDeleteModal(TWO_CHECKS);

    const confirmButton = await screen.findByRole('button', { name: 'Delete checks' });
    expect(confirmButton).toBeDisabled();

    await user.type(getDeleteConfirmationInput(), 'yes');
    expect(confirmButton).toBeDisabled();

    await user.clear(getDeleteConfirmationInput());
    await user.type(getDeleteConfirmationInput(), 'Delete');
    expect(confirmButton).toBeEnabled();

    expect(requests.length).toBe(0);

    await user.click(confirmButton);
    await waitFor(() => expect(requests.length).toBe(TWO_CHECKS.length));
  });

  it('says how many checks will go and that it cannot be undone', async () => {
    await selectAllAndOpenDeleteModal(TWO_CHECKS);

    expect(await screen.findByText('Delete 2 checks')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to delete 2 checks?')).toBeInTheDocument();
    expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument();
  });

  it('deletes nothing when the modal is dismissed after the word is typed', async () => {
    const { record, requests } = getServerRequests();
    server.use(apiRoute('deleteCheck', {}, record));

    const { user } = await selectAllAndOpenDeleteModal(TWO_CHECKS);

    await user.type(getDeleteConfirmationInput(), 'Delete');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(requests.length).toBe(0);
  });
});

describe('CheckList - scope of the select-all checkbox', () => {
  it('selects only the checks on the visible page', async () => {
    const { user } = await renderCheckList(CHECKS_ACROSS_TWO_PAGES);

    await user.click(await screen.findByTestId(CHECKS_TEST_ID.header.selectAll));

    expect(await screen.findByText(`${CHECKS_PER_PAGE_CARD} checks are selected.`)).toBeInTheDocument();
  });

  it('deletes only the visible page, leaving the rest of the list alone', async () => {
    const { record, requests } = getServerRequests();
    server.use(apiRoute('deleteCheck', {}, record));

    const { user } = await selectAllAndOpenDeleteModal(CHECKS_ACROSS_TWO_PAGES);

    expect(await screen.findByText(`Delete ${CHECKS_PER_PAGE_CARD} checks`)).toBeInTheDocument();

    // CHECKS_PER_PAGE_CARD is above the threshold, so the count must be typed, not just "Delete".
    await confirmBulkDelete(user, `Delete ${CHECKS_PER_PAGE_CARD}`);
    await waitFor(() => expect(requests.length).toBe(CHECKS_PER_PAGE_CARD));
  });

  it('still selects every check in folder view, which is not paginated', async () => {
    mockFeatureToggles({ [FeatureName.Folders]: true });

    const { user } = await renderCheckList(CHECKS_ACROSS_TWO_PAGES);

    await user.click(await screen.findByTestId(CHECKS_TEST_ID.header.selectAll));

    expect(await screen.findByText(`${CHECKS_ACROSS_TWO_PAGES.length} checks are selected.`)).toBeInTheDocument();
  });
});

describe('CheckList - stricter confirmation for large selections', () => {
  it('accepts the bare word "Delete" at the threshold', async () => {
    const checks = buildChecks(DELETE_CONFIRMATION_COUNT_THRESHOLD);
    const { user } = await selectAllAndOpenDeleteModal(checks);

    expect(getDeleteConfirmationInput()).toHaveAttribute(
      'placeholder',
      `Type "Delete" to confirm`
    );

    await confirmBulkDelete(user);
  });

  it('requires typing the count once the selection exceeds the threshold', async () => {
    const checks = buildChecks(DELETE_CONFIRMATION_COUNT_THRESHOLD + 1);
    const { user } = await selectAllAndOpenDeleteModal(checks);

    const confirmationText = `Delete ${checks.length}`;
    const confirmButton = await screen.findByRole('button', { name: 'Delete checks' });

    expect(getDeleteConfirmationInput(confirmationText)).toHaveAttribute(
      'placeholder',
      `Type "${confirmationText}" to confirm`
    );

    // The old, no-longer-sufficient word does not enable the button.
    await user.type(getDeleteConfirmationInput(confirmationText), DELETE_CONFIRMATION_TEXT);
    expect(confirmButton).toBeDisabled();

    await user.clear(getDeleteConfirmationInput(confirmationText));
    await confirmBulkDelete(user, confirmationText);
  });
});
