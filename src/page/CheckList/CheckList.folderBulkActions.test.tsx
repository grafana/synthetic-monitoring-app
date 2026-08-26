import React from 'react';
import { screen, waitFor, within } from '@testing-library/react';
import {
  CHECK_IN_DELETABLE_FOLDER,
  CHECK_IN_PRODUCTION,
  CHECK_IN_READONLY_FOLDER,
  CHECK_IN_STAGING,
  CHECK_WITHOUT_FOLDER,
  SECOND_CHECK_IN_DELETABLE_FOLDER,
} from 'test/fixtures/folderChecks';
import { PRIVATE_PROBE, PUBLIC_PROBE } from 'test/fixtures/probes';
import { apiRoute, getServerRequests } from 'test/handlers';
import { render } from 'test/render';
import { server } from 'test/server';
import { mockFeatureToggles } from 'test/utils';

import { Check, FeatureName } from 'types';
import { AppRoutes } from 'routing/types';
import { generateRoutePath } from 'routing/utils';

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

  const res = render(<CheckList />, {
    route: AppRoutes.Checks,
    path: generateRoutePath(AppRoutes.Checks),
  });

  expect(await screen.findByText('Create new check')).toBeInTheDocument();
  return res;
};

describe('CheckList - Per-folder Bulk Actions', () => {
  beforeEach(() => mockFeatureToggles({ [FeatureName.Folders]: true }));

  it('shows a select-all checkbox in each folder header', async () => {
    await renderCheckList([CHECK_IN_PRODUCTION, CHECK_IN_STAGING]);

    expect(await screen.findByLabelText('Select all checks in Production')).toBeInTheDocument();
    expect(screen.getByLabelText('Select all checks in Staging')).toBeInTheDocument();
  });

  it('shows selected count and inline bulk actions when folder checkbox is clicked', async () => {
    const { user } = await renderCheckList([CHECK_IN_PRODUCTION]);

    const folderCheckbox = await screen.findByLabelText('Select all checks in Production');
    await user.click(folderCheckbox);

    const selectedLabel = await screen.findByText('1 selected');
    const folderActions = selectedLabel.closest('div')!;

    expect(within(folderActions).getByRole('button', { name: 'Move to folder' })).toBeInTheDocument();
    expect(within(folderActions).getByRole('button', { name: 'Enable' })).toBeInTheDocument();
    expect(within(folderActions).getByRole('button', { name: 'Disable' })).toBeInTheDocument();
    expect(within(folderActions).getByRole('button', { name: 'Delete' })).toBeInTheDocument();
  });

  it('deselects all checks when the folder checkbox is clicked again', async () => {
    const { user } = await renderCheckList([CHECK_IN_PRODUCTION]);

    const folderCheckbox = await screen.findByLabelText('Select all checks in Production');
    await user.click(folderCheckbox);
    expect(await screen.findByText('1 selected')).toBeInTheDocument();

    await user.click(folderCheckbox);
    await waitFor(() => {
      expect(screen.queryByText('1 selected')).not.toBeInTheDocument();
    });
  });

  it('selects individual check checkboxes when folder select-all is clicked', async () => {
    const { user } = await renderCheckList([CHECK_IN_PRODUCTION]);

    const folderCheckbox = await screen.findByLabelText('Select all checks in Production');
    await user.click(folderCheckbox);

    await waitFor(() => {
      const checkCheckboxes = screen.getAllByLabelText('Select check');
      checkCheckboxes.forEach((cb) => expect(cb).toBeChecked());
    });
  });

  it('does not show bulk actions when no checks are selected in folder', async () => {
    await renderCheckList([CHECK_IN_PRODUCTION]);

    await screen.findByLabelText('Select all checks in Production');
    expect(screen.queryByText(/selected/)).not.toBeInTheDocument();
  });

  it('shows per-folder actions for multiple folders independently', async () => {
    const { user } = await renderCheckList([CHECK_IN_PRODUCTION, CHECK_IN_STAGING]);

    const productionCheckbox = await screen.findByLabelText('Select all checks in Production');
    await user.click(productionCheckbox);

    expect(await screen.findByText('1 selected')).toBeInTheDocument();

    const stagingCheckbox = screen.getByLabelText('Select all checks in Staging');
    expect(stagingCheckbox).not.toBeChecked();
  });
});

describe('CheckList - Bulk Delete leaves folders intact', () => {
  beforeEach(() => mockFeatureToggles({ [FeatureName.Folders]: true }));

  const clickFolderDeleteButton = async (user: ReturnType<typeof render>['user'], expectedSelectedText: string) => {
    const selectedLabel = await screen.findByText(expectedSelectedText);
    const folderActions = selectedLabel.closest('div')!;
    const deleteButton = within(folderActions as HTMLElement).getByRole('button', { name: 'Delete' });
    await user.click(deleteButton);
  };

  it('shows a checks-only delete confirmation even when all checks in a deletable folder are selected', async () => {
    const { user } = await renderCheckList([CHECK_IN_DELETABLE_FOLDER, SECOND_CHECK_IN_DELETABLE_FOLDER]);

    const folderCheckbox = await screen.findByLabelText('Select all checks in Deletable');
    await user.click(folderCheckbox);

    await clickFolderDeleteButton(user, '2 selected');

    expect(await screen.findByText('Delete 2 checks')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to delete these checks?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete checks' })).toBeInTheDocument();
    expect(screen.queryByText(/Delete folder/)).not.toBeInTheDocument();
  });

  it('deletes only the checks and never the folder when confirming', async () => {
    const { record: recordDelete, requests: deleteRequests } = getServerRequests();
    const { record: recordFolderDelete, requests: folderDeleteRequests } = getServerRequests();

    server.use(apiRoute('deleteCheck', {}, recordDelete), apiRoute('deleteFolder', {}, recordFolderDelete));

    const { user } = await renderCheckList([CHECK_IN_DELETABLE_FOLDER, SECOND_CHECK_IN_DELETABLE_FOLDER]);

    const folderCheckbox = await screen.findByLabelText('Select all checks in Deletable');
    await user.click(folderCheckbox);

    await clickFolderDeleteButton(user, '2 selected');

    const confirmButton = await screen.findByRole('button', { name: 'Delete checks' });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(deleteRequests.length).toBe(2);
    });
    expect(folderDeleteRequests.length).toBe(0);
  });
});

describe('CheckList - Folder Actions menu', () => {
  beforeEach(() => mockFeatureToggles({ [FeatureName.Folders]: true }));

  it('offers folder-wide actions in an always-visible Actions menu', async () => {
    const { user } = await renderCheckList([CHECK_IN_DELETABLE_FOLDER, SECOND_CHECK_IN_DELETABLE_FOLDER]);

    // Visible without selecting anything, unlike the inline bulk actions.
    const actionsButton = await screen.findByRole('button', { name: 'Actions for folder Deletable' });
    expect(screen.queryByText(/selected/)).not.toBeInTheDocument();

    await user.click(actionsButton);

    expect(await screen.findByRole('menuitem', { name: 'Enable all checks' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Disable all checks' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Move checks to folder' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Delete all checks' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Move folder' })).toBeInTheDocument();
  });

  it('deletes every check in the folder via the menu without deleting the folder', async () => {
    const { record: recordDelete, requests: deleteRequests } = getServerRequests();
    const { record: recordFolderDelete, requests: folderDeleteRequests } = getServerRequests();

    server.use(apiRoute('deleteCheck', {}, recordDelete), apiRoute('deleteFolder', {}, recordFolderDelete));

    const { user } = await renderCheckList([CHECK_IN_DELETABLE_FOLDER, SECOND_CHECK_IN_DELETABLE_FOLDER]);

    await user.click(await screen.findByRole('button', { name: 'Actions for folder Deletable' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Delete all checks' }));

    expect(await screen.findByText('Delete 2 checks')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Delete checks' }));

    await waitFor(() => {
      expect(deleteRequests.length).toBe(2);
    });
    expect(folderDeleteRequests.length).toBe(0);
  });

  it('acts on the whole folder including checks nested in subfolders', async () => {
    const { read, record } = getServerRequests();
    server.use(apiRoute('bulkUpdateChecks', {}, record));

    // CHECK_WITHOUT_FOLDER lives in the default folder directly;
    // CHECK_IN_PRODUCTION is nested inside its Production subfolder.
    const { user } = await renderCheckList([CHECK_WITHOUT_FOLDER, CHECK_IN_PRODUCTION]);

    await user.click(
      await screen.findByRole('button', { name: /Actions for folder Grafana Synthetic Monitoring \(default\)/ })
    );
    await user.click(await screen.findByRole('menuitem', { name: 'Disable all checks' }));

    const { body } = await read();
    const updated = body as Check[];
    expect(updated.map((check) => check.id).sort()).toEqual([CHECK_IN_PRODUCTION.id, CHECK_WITHOUT_FOLDER.id].sort());
    updated.forEach((check) => expect(check.enabled).toBe(false));
  });

  it('does not render the Actions menu when the user cannot modify anything in the folder', async () => {
    await renderCheckList([CHECK_IN_READONLY_FOLDER]);

    expect(await screen.findByText('Read Only')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Actions for folder Read Only/ })).not.toBeInTheDocument();
  });
});
