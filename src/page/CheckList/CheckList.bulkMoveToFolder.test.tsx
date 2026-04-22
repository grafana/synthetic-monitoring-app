import React from 'react';
import { screen, within } from '@testing-library/react';
import { DataTestIds } from 'test/dataTestIds';
import { CHECK_IN_PRODUCTION, CHECK_IN_READONLY_FOLDER, CHECK_IN_STAGING } from 'test/fixtures/folderChecks';
import { FOLDER_STAGING } from 'test/fixtures/folders';
import { PRIVATE_PROBE, PUBLIC_PROBE } from 'test/fixtures/probes';
import { apiRoute, getServerRequests } from 'test/handlers';
import { render } from 'test/render';
import { server } from 'test/server';
import { mockFeatureToggles } from 'test/utils';

import { Check, FeatureName } from 'types';
import { AppRoutes } from 'routing/types';
import { generateRoutePath } from 'routing/utils';

import { BulkMoveToFolderModal } from './components/BulkMoveToFolderModal';
import { CheckList } from './CheckList';

const renderCheckList = async (checks: Check[]) => {
  server.use(
    apiRoute(`listChecks`, {
      result: () => ({ json: checks }),
    }),
    apiRoute(`listProbes`, {
      result: () => ({ json: [PRIVATE_PROBE, PUBLIC_PROBE] }),
    })
  );

  const path = generateRoutePath(AppRoutes.Checks);

  const res = render(<CheckList />, {
    route: AppRoutes.Checks,
    path,
  });

  expect(await screen.findByText('Create new check')).toBeInTheDocument();
  return res;
};

describe('CheckList - Bulk Move to Folder', () => {
  describe('with folders feature enabled', () => {
    beforeEach(() => mockFeatureToggles({ [FeatureName.Folders]: true }));

    it('shows the "Move to folder" button when checks are selected', async () => {
      const { user } = await renderCheckList([CHECK_IN_PRODUCTION, CHECK_IN_STAGING]);
      const selectAll = await screen.findByTestId(DataTestIds.SelectAllChecks);
      await user.click(selectAll);

      expect(await screen.findByRole('button', { name: /Move to folder/i })).toBeInTheDocument();
    });

    it('opens a modal with a folder selector when "Move to folder" is clicked', async () => {
      const { user } = await renderCheckList([CHECK_IN_PRODUCTION, CHECK_IN_STAGING]);
      const selectAll = await screen.findByTestId(DataTestIds.SelectAllChecks);
      await user.click(selectAll);

      const moveButton = await screen.findByRole('button', { name: /Move to folder/i });
      await user.click(moveButton);

      const modal = await screen.findByRole('dialog');
      expect(within(modal).getByText('Move 2 checks to folder')).toBeInTheDocument();
      expect(within(modal).getByText('Target folder')).toBeInTheDocument();
      expect(within(modal).getByText('All selected checks will be moved to this folder.')).toBeInTheDocument();
      expect(within(modal).getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
      expect(within(modal).getByRole('button', { name: 'Move' })).toBeDisabled();
    });

    it('disables "Move to folder" when selected checks include one in a read-only folder', async () => {
      const { user } = await renderCheckList([CHECK_IN_PRODUCTION, CHECK_IN_READONLY_FOLDER]);
      const selectAll = await screen.findByTestId(DataTestIds.SelectAllChecks);
      await user.click(selectAll);

      const moveButton = await screen.findByRole('button', { name: /Move to folder/i });
      expect(moveButton).toBeDisabled();
    });

    it('closes the modal when cancel is clicked', async () => {
      const { user } = await renderCheckList([CHECK_IN_PRODUCTION, CHECK_IN_STAGING]);
      const selectAll = await screen.findByTestId(DataTestIds.SelectAllChecks);
      await user.click(selectAll);

      const moveButton = await screen.findByRole('button', { name: /Move to folder/i });
      await user.click(moveButton);

      const modal = await screen.findByRole('dialog');
      const cancelButton = within(modal).getByRole('button', { name: 'Cancel' });
      await user.click(cancelButton);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('with folders feature disabled', () => {
    it('does not show the "Move to folder" button', async () => {
      const { user } = await renderCheckList([CHECK_IN_PRODUCTION, CHECK_IN_STAGING]);
      const selectAll = await screen.findByTestId(DataTestIds.SelectAllChecks);
      await user.click(selectAll);

      await screen.findByText('2 checks are selected.');
      expect(screen.queryByRole('button', { name: /Move to folder/i })).not.toBeInTheDocument();
    });
  });
});

describe('BulkMoveToFolderModal', () => {
  it('sends bulk update with selected folder when confirmed', async () => {
    const { read, record } = getServerRequests();
    server.use(apiRoute(`bulkUpdateChecks`, {}, record));

    const onDismiss = jest.fn();
    const checks = [CHECK_IN_PRODUCTION, CHECK_IN_STAGING];

    const { user } = render(
      <BulkMoveToFolderModal checks={checks} isOpen onDismiss={jest.fn()} onMoved={onDismiss} />
    );

    const combobox = await screen.findByPlaceholderText(/Select a folder/);

    await user.click(combobox);
    await user.clear(combobox);
    await user.type(combobox, 'Staging{enter}');

    const submitButton = await screen.findByRole('button', { name: 'Move' });
    expect(submitButton).not.toBeDisabled();
    await user.click(submitButton);

    const { body } = await read();

    expect(body).toEqual(
      checks.map((check) => ({
        ...check,
        folderUid: FOLDER_STAGING.uid,
      }))
    );
  });

  it('does not offer read-only folders as options', async () => {
    const { user } = render(
      <BulkMoveToFolderModal checks={[CHECK_IN_PRODUCTION]} isOpen onDismiss={jest.fn()} onMoved={jest.fn()} />
    );

    const combobox = await screen.findByPlaceholderText(/Select a folder/);
    await user.click(combobox);
    await user.clear(combobox);
    await user.type(combobox, 'Read Only{enter}');

    expect(screen.getByRole('button', { name: 'Move' })).toBeDisabled();
  });

  it('disables the Move button when no folder is selected', async () => {
    render(
      <BulkMoveToFolderModal checks={[CHECK_IN_PRODUCTION]} isOpen onDismiss={jest.fn()} onMoved={jest.fn()} />
    );

    await screen.findByPlaceholderText(/Select a folder/);
    expect(screen.getByRole('button', { name: 'Move' })).toBeDisabled();
  });

  it('shows singular title for a single check', async () => {
    render(
      <BulkMoveToFolderModal checks={[CHECK_IN_PRODUCTION]} isOpen onDismiss={jest.fn()} onMoved={jest.fn()} />
    );

    expect(await screen.findByText('Move 1 check to folder')).toBeInTheDocument();
  });
});
