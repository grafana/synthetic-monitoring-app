import React from 'react';
import { screen, waitFor, within } from '@testing-library/react';
import {
  CHECK_IN_DELETABLE_FOLDER,
  CHECK_IN_EXTERNAL_FOLDER,
  CHECK_IN_PRODUCTION,
  CHECK_IN_STAGING,
  CHECK_WITH_ORPHANED_FOLDER,
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

describe('CheckList - Folder Deletion on Bulk Delete', () => {
  beforeEach(() => mockFeatureToggles({ [FeatureName.Folders]: true }));

  const clickFolderDeleteButton = async (user: ReturnType<typeof render>['user'], expectedSelectedText: string) => {
    const selectedLabel = await screen.findByText(expectedSelectedText);
    const folderActions = selectedLabel.closest('div')!;
    const deleteButton = within(folderActions as HTMLElement).getByRole('button', { name: 'Delete' });
    await user.click(deleteButton);
  };

  it('shows folder-aware delete confirmation when all checks in a deletable folder are selected', async () => {
    const { user } = await renderCheckList([CHECK_IN_DELETABLE_FOLDER, SECOND_CHECK_IN_DELETABLE_FOLDER]);

    const folderCheckbox = await screen.findByLabelText('Select all checks in Deletable');
    await user.click(folderCheckbox);

    await clickFolderDeleteButton(user, '2 selected');

    expect(await screen.findByText(/Delete folder "Deletable" \+ 2 checks/)).toBeInTheDocument();
    expect(screen.getByText(/This will delete the folder, including 2 checks\. This action cannot be undone\./)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete folder and checks' })).toBeInTheDocument();
  });

  it('shows standard delete confirmation when only some checks in a folder are selected', async () => {
    const { user } = await renderCheckList([CHECK_IN_DELETABLE_FOLDER, SECOND_CHECK_IN_DELETABLE_FOLDER]);

    const checkCheckboxes = await screen.findAllByLabelText('Select check');
    await user.click(checkCheckboxes[0]!);

    await clickFolderDeleteButton(user, '1 selected');

    expect(await screen.findByText('Delete 1 check')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to delete these checks?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete checks' })).toBeInTheDocument();
  });

  it('does not offer folder deletion for the default folder even when all checks are selected', async () => {
    const { user } = await renderCheckList([CHECK_WITHOUT_FOLDER]);

    const folderCheckbox = await screen.findByLabelText(/Select all checks in.*\(default\)/);
    await user.click(folderCheckbox);

    await clickFolderDeleteButton(user, '1 selected');

    expect(await screen.findByText('Delete 1 check')).toBeInTheDocument();
    expect(screen.queryByText(/Delete folder/)).not.toBeInTheDocument();
  });

  it('does not offer folder deletion for orphaned folders', async () => {
    const { user } = await renderCheckList([CHECK_WITH_ORPHANED_FOLDER]);

    const folderCheckbox = await screen.findByLabelText(/Select all checks in/);
    await user.click(folderCheckbox);

    await clickFolderDeleteButton(user, '1 selected');

    expect(await screen.findByText('Delete 1 check')).toBeInTheDocument();
    expect(screen.queryByText(/Delete folder/)).not.toBeInTheDocument();
  });

  it('does not offer folder deletion for folders outside the default folder', async () => {
    const { user } = await renderCheckList([CHECK_IN_EXTERNAL_FOLDER]);

    const folderCheckbox = await screen.findByLabelText(/Select all checks in/);
    await user.click(folderCheckbox);

    await clickFolderDeleteButton(user, '1 selected');

    expect(await screen.findByText('Delete 1 check')).toBeInTheDocument();
    expect(screen.queryByText(/Delete folder/)).not.toBeInTheDocument();
  });

  it('calls both check delete and folder delete APIs when confirming folder deletion', async () => {
    const { record: recordDelete, requests: deleteRequests } = getServerRequests();
    const { record: recordFolderDelete, requests: folderDeleteRequests } = getServerRequests();

    server.use(
      apiRoute('deleteCheck', {}, recordDelete),
      apiRoute('deleteFolder', {}, recordFolderDelete)
    );

    const { user } = await renderCheckList([CHECK_IN_DELETABLE_FOLDER]);

    const folderCheckbox = await screen.findByLabelText('Select all checks in Deletable');
    await user.click(folderCheckbox);

    await clickFolderDeleteButton(user, '1 selected');

    const confirmButton = await screen.findByRole('button', { name: 'Delete folder and checks' });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(deleteRequests.length).toBe(1);
      expect(folderDeleteRequests.length).toBe(1);
    });

    const folderDeleteUrl = new URL(folderDeleteRequests[0]!.url);
    expect(folderDeleteUrl.pathname).toContain('folder-deletable');
  });
});
