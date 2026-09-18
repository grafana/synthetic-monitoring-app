import React from 'react';
import { screen, within } from '@testing-library/react';
import {
  CHECK_IN_PRODUCTION,
  CHECK_IN_ROOT_CHILD_FOLDER,
  CHECK_IN_ROOT_FOLDER,
  CHECK_WITHOUT_FOLDER,
} from 'test/fixtures/folderChecks';
import {
  DEFAULT_FOLDER,
  FOLDER_PRODUCTION,
  FOLDER_ROOT,
  FOLDER_ROOT_CHILD,
  FOLDER_SHARED_DIRECTLY,
  FOLDER_SHARED_WITH_ME,
  MOCK_FOLDERS,
} from 'test/fixtures/folders';
import { PRIVATE_PROBE, PUBLIC_PROBE } from 'test/fixtures/probes';
import { apiRoute, getServerRequests } from 'test/handlers';
import { listFolders } from 'test/handlers/folders';
import { render } from 'test/render';
import { server } from 'test/server';
import { mockFeatureToggles, testUsesCombobox } from 'test/utils';

import { Check, FeatureName } from 'types';
import { AppRoutes } from 'routing/types';
import { generateRoutePath } from 'routing/utils';
import { buildChecksByFolder, collectAllFolderUids } from 'hooks/useChecksByFolder';

import { CheckList } from './CheckList';

const renderCheckList = async (checks: Check[], searchParams = 'view=folder') => {
  server.use(
    apiRoute(`listChecks`, {
      result: () => ({ json: checks }),
    }),
    apiRoute(`listProbes`, {
      result: () => ({ json: [PRIVATE_PROBE, PUBLIC_PROBE] }),
    })
  );

  const path = `${generateRoutePath(AppRoutes.Checks)}?${searchParams}`;

  const res = render(<CheckList />, {
    route: AppRoutes.Checks,
    path,
  });

  expect(await screen.findByText('Create new check')).toBeInTheDocument();
  return res;
};

describe('buildChecksByFolder - outside folders', () => {
  test('outside folders referenced by checks appear at top level flagged as outside', () => {
    const { folderTree } = buildChecksByFolder([CHECK_IN_ROOT_FOLDER], MOCK_FOLDERS, DEFAULT_FOLDER.uid, false, [
      FOLDER_ROOT,
    ]);

    const outsideNode = folderTree.find((n) => n.folderUid === FOLDER_ROOT.uid);
    expect(outsideNode).toBeDefined();
    expect(outsideNode!.isOutside).toBe(true);
    expect(outsideNode!.isOrphaned).toBe(false);
    expect(outsideNode!.checks).toHaveLength(1);
  });

  test('outside folders without checks do not get nodes', () => {
    const { folderTree } = buildChecksByFolder([CHECK_IN_PRODUCTION], MOCK_FOLDERS, DEFAULT_FOLDER.uid, false, [
      FOLDER_ROOT,
    ]);

    expect(collectAllFolderUids(folderTree)).not.toContain(FOLDER_ROOT.uid);
  });

  test('an outside folder nests under its parent when the parent is also known', () => {
    const { folderTree } = buildChecksByFolder(
      [CHECK_IN_ROOT_FOLDER, CHECK_IN_ROOT_CHILD_FOLDER],
      MOCK_FOLDERS,
      DEFAULT_FOLDER.uid,
      false,
      [FOLDER_ROOT, FOLDER_ROOT_CHILD]
    );

    const parentNode = folderTree.find((n) => n.folderUid === FOLDER_ROOT.uid);
    expect(parentNode).toBeDefined();
    const childNode = parentNode!.children.find((n) => n.folderUid === FOLDER_ROOT_CHILD.uid);
    expect(childNode).toBeDefined();
    expect(childNode!.isOutside).toBe(true);
    expect(childNode!.checks).toHaveLength(1);
  });

  test('an outside folder with an unknown parent renders at top level without bogus ancestor nodes', () => {
    const { folderTree } = buildChecksByFolder([CHECK_IN_ROOT_CHILD_FOLDER], MOCK_FOLDERS, DEFAULT_FOLDER.uid, false, [
      FOLDER_ROOT_CHILD,
    ]);

    const childNode = folderTree.find((n) => n.folderUid === FOLDER_ROOT_CHILD.uid);
    expect(childNode).toBeDefined();
    expect(collectAllFolderUids(folderTree)).not.toContain(FOLDER_ROOT.uid);
  });
});

describe('CheckList - Outside folders', () => {
  beforeEach(() => mockFeatureToggles({ [FeatureName.Folders]: true }));

  test('shows a root-level folder containing checks as a top-level group without a badge', async () => {
    await renderCheckList([CHECK_IN_PRODUCTION, CHECK_IN_ROOT_FOLDER]);

    expect(await screen.findByText(FOLDER_ROOT.title)).toBeInTheDocument();
    expect(screen.getByText(CHECK_IN_ROOT_FOLDER.job)).toBeInTheDocument();
    // Position in the hierarchy conveys the location; there is no Root badge.
    expect(screen.queryByText('Root')).not.toBeInTheDocument();
  });

  test('nests a subfolder of an outside folder under its parent', async () => {
    await renderCheckList([CHECK_IN_ROOT_FOLDER, CHECK_IN_ROOT_CHILD_FOLDER]);

    expect(await screen.findByText(FOLDER_ROOT.title)).toBeInTheDocument();
    expect(await screen.findByText(FOLDER_ROOT_CHILD.title)).toBeInTheDocument();
    expect(screen.getByText(CHECK_IN_ROOT_CHILD_FOLDER.job)).toBeInTheDocument();
    expect(screen.queryByText('Root')).not.toBeInTheDocument();
  });

  test('does not show empty outside folders in the check list', async () => {
    await renderCheckList([CHECK_IN_PRODUCTION]);

    expect(await screen.findByText(FOLDER_PRODUCTION.title)).toBeInTheDocument();
    expect(screen.queryByText(FOLDER_ROOT.title)).not.toBeInTheDocument();
  });

  test('includes outside folders containing checks in the folder filter', async () => {
    testUsesCombobox();
    const { user } = await renderCheckList([CHECK_IN_PRODUCTION, CHECK_IN_ROOT_FOLDER]);

    const filterButton = screen.getByRole('button', { name: /additional filters/i });
    await user.click(filterButton);

    const modal = document.body.querySelector('[role="dialog"]') as HTMLElement;
    const folderFilter = within(modal).getByPlaceholderText('All folders');
    await user.click(folderFilter);

    expect(await screen.findByRole('option', { name: FOLDER_ROOT.title })).toBeInTheDocument();
  });

  test('excludes empty outside folders from the folder filter', async () => {
    testUsesCombobox();
    const { user } = await renderCheckList([CHECK_IN_PRODUCTION]);

    const filterButton = screen.getByRole('button', { name: /additional filters/i });
    await user.click(filterButton);

    const modal = document.body.querySelector('[role="dialog"]') as HTMLElement;
    const folderFilter = within(modal).getByPlaceholderText('All folders');
    await user.click(folderFilter);

    expect(await screen.findByRole('option', { name: FOLDER_PRODUCTION.title })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: FOLDER_ROOT.title })).not.toBeInTheDocument();
  });
});

describe('CheckList - Move folder', () => {
  beforeEach(() => mockFeatureToggles({ [FeatureName.Folders]: true }));

  // The move action lives in the folder's always-visible Actions menu.
  const openMoveFolderModal = async (user: ReturnType<typeof render>['user'], folderName: string | RegExp) => {
    const name = typeof folderName === 'string' ? `Actions for folder ${folderName}` : folderName;
    await user.click(await screen.findByRole('button', { name }));
    await user.click(await screen.findByRole('menuitem', { name: 'Move folder' }));
  };

  test('moves a subtree folder to the root level', async () => {
    const { read, record } = getServerRequests();
    server.use(apiRoute(`moveFolder`, {}, record));

    const { user } = await renderCheckList([CHECK_IN_PRODUCTION]);

    expect(await screen.findByText(FOLDER_PRODUCTION.title)).toBeInTheDocument();
    await openMoveFolderModal(user, FOLDER_PRODUCTION.title);

    const modal = await screen.findByRole('dialog');
    expect(within(modal).getByText(`Move folder "${FOLDER_PRODUCTION.title}"`)).toBeInTheDocument();

    // No destination is preselected; Move stays disabled until an explicit pick
    expect(within(modal).getByRole('button', { name: 'Move' })).toBeDisabled();

    const picker = within(modal).getByLabelText('Folder picker');
    await user.selectOptions(picker, within(modal).getByRole('option', { name: 'Dashboards' }));
    await user.click(within(modal).getByRole('button', { name: 'Move' }));

    const { body } = await read();
    expect(body).toEqual({ parentUid: '' });
  });

  test('hides "Shared with me" as a move destination when nothing is shared with the user', async () => {
    const { user } = await renderCheckList([CHECK_IN_PRODUCTION]);

    expect(await screen.findByText(FOLDER_PRODUCTION.title)).toBeInTheDocument();
    await openMoveFolderModal(user, FOLDER_PRODUCTION.title);

    const modal = await screen.findByRole('dialog');
    const picker = within(modal).getByLabelText('Folder picker');
    await within(picker).findByRole('option', { name: 'Dashboards' });
    expect(within(picker).queryByRole('option', { name: FOLDER_SHARED_WITH_ME.title })).not.toBeInTheDocument();
  });

  test('keeps "Shared with me" browsable as a move destination when a folder is directly shared with the user', async () => {
    server.use(
      apiRoute('listFolders', {
        result: async (req) => {
          const res = await listFolders.result(req);
          const url = new URL(req.url);
          if (url.searchParams.get('parentUid') !== FOLDER_SHARED_WITH_ME.uid) {
            return res;
          }
          const { uid, title, url: folderUrl, parentUid } = FOLDER_SHARED_DIRECTLY;
          return { json: [...res.json, { uid, title, url: folderUrl, parentUid }] };
        },
      }),
      apiRoute('searchFolders', {
        result: async () => ({
          json: { totalHits: 1, hits: [{ resource: 'folders', name: FOLDER_SHARED_DIRECTLY.uid, title: FOLDER_SHARED_DIRECTLY.title }] },
        }),
      })
    );

    const { user } = await renderCheckList([CHECK_IN_PRODUCTION]);

    expect(await screen.findByText(FOLDER_PRODUCTION.title)).toBeInTheDocument();
    await openMoveFolderModal(user, FOLDER_PRODUCTION.title);

    const modal = await screen.findByRole('dialog');
    const picker = within(modal).getByLabelText('Folder picker');
    expect(await within(picker).findByRole('option', { name: FOLDER_SHARED_WITH_ME.title })).toBeInTheDocument();
    expect(within(picker).getByRole('option', { name: FOLDER_SHARED_DIRECTLY.title })).toBeInTheDocument();
  });

  test('tracks picking "Move folder" so its usage can be measured', async () => {
    const reportInteraction = jest.fn();
    jest.requireMock('@grafana/runtime').reportInteraction = reportInteraction;

    const { user } = await renderCheckList([CHECK_IN_PRODUCTION]);

    expect(await screen.findByText(FOLDER_PRODUCTION.title)).toBeInTheDocument();
    await openMoveFolderModal(user, FOLDER_PRODUCTION.title);

    expect(reportInteraction).toHaveBeenCalledWith(
      'synthetic-monitoring_folders_move_folder_clicked',
      expect.any(Object)
    );
  });

  test('picking the current parent is a no-op: Move stays disabled with an explanation', async () => {
    const { user } = await renderCheckList([CHECK_IN_PRODUCTION]);

    expect(await screen.findByText(FOLDER_PRODUCTION.title)).toBeInTheDocument();
    await openMoveFolderModal(user, FOLDER_PRODUCTION.title);

    const modal = await screen.findByRole('dialog');
    const picker = within(modal).getByLabelText('Folder picker');

    // The current parent (the default folder) is offered rather than hidden,
    // so users looking for it don't fall back to another destination...
    expect(await within(modal).findByRole('option', { name: DEFAULT_FOLDER.title })).toBeInTheDocument();
    await user.selectOptions(picker, DEFAULT_FOLDER.uid);

    // ...but picking it keeps Move disabled and explains why
    expect(within(modal).getByRole('button', { name: 'Move' })).toBeDisabled();
    expect(within(modal).getByText('The folder is already in this location.')).toBeInTheDocument();
  });

  test('moves an outside folder into the default folder', async () => {
    const { read, record } = getServerRequests();
    server.use(apiRoute(`moveFolder`, {}, record));

    const { user } = await renderCheckList([CHECK_IN_ROOT_FOLDER]);

    expect(await screen.findByText(FOLDER_ROOT.title)).toBeInTheDocument();
    await openMoveFolderModal(user, FOLDER_ROOT.title);

    const modal = await screen.findByRole('dialog');
    expect(within(modal).getByRole('button', { name: 'Move' })).toBeDisabled();

    const picker = within(modal).getByLabelText('Folder picker');
    expect(await within(modal).findByRole('option', { name: DEFAULT_FOLDER.title })).toBeInTheDocument();
    await user.selectOptions(picker, DEFAULT_FOLDER.uid);
    await user.click(within(modal).getByRole('button', { name: 'Move' }));

    const { body } = await read();
    expect(body).toEqual({ parentUid: DEFAULT_FOLDER.uid });
  });

  test('moves a folder into an arbitrary folder picked from the tree', async () => {
    const { read, record } = getServerRequests();
    server.use(apiRoute(`moveFolder`, {}, record));

    const { user } = await renderCheckList([CHECK_IN_PRODUCTION]);

    expect(await screen.findByText(FOLDER_PRODUCTION.title)).toBeInTheDocument();
    await openMoveFolderModal(user, FOLDER_PRODUCTION.title);

    const modal = await screen.findByRole('dialog');
    const picker = within(modal).getByLabelText('Folder picker');
    expect(await within(modal).findByRole('option', { name: FOLDER_ROOT.title })).toBeInTheDocument();
    await user.selectOptions(picker, FOLDER_ROOT.uid);
    await user.click(within(modal).getByRole('button', { name: 'Move' }));

    const { body } = await read();
    expect(body).toEqual({ parentUid: FOLDER_ROOT.uid });
  });

  // Circular moves are rejected server-side by design, so the API's reason is
  // the only explanation available. getBackendSrv rejects with a FetchError,
  // which is a plain object rather than an Error, so a naive instanceof check
  // silently swallows it.
  test('surfaces the API reason when the server rejects a move', async () => {
    server.use(
      apiRoute(`moveFolder`, {
        result: () => ({
          status: 400,
          json: { message: 'folder cannot be moved to one of its descendants' },
        }),
      })
    );

    const { user } = await renderCheckList([CHECK_IN_PRODUCTION]);

    expect(await screen.findByText(FOLDER_PRODUCTION.title)).toBeInTheDocument();
    await openMoveFolderModal(user, FOLDER_PRODUCTION.title);

    const modal = await screen.findByRole('dialog');
    const picker = within(modal).getByLabelText('Folder picker');
    expect(await within(modal).findByRole('option', { name: FOLDER_ROOT.title })).toBeInTheDocument();
    await user.selectOptions(picker, FOLDER_ROOT.uid);
    await user.click(within(modal).getByRole('button', { name: 'Move' }));

    expect(await within(modal).findByText('folder cannot be moved to one of its descendants')).toBeInTheDocument();
  });

  test('does not offer moving the default folder', async () => {
    const { user } = await renderCheckList([CHECK_WITHOUT_FOLDER]);

    // The default folder's Actions menu offers check-level actions but
    // never a move action for the folder itself.
    await user.click(
      await screen.findByRole('button', { name: /Actions for folder Grafana Synthetic Monitoring \(default\)/ })
    );

    expect(await screen.findByRole('menuitem', { name: 'Delete all checks' })).toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: 'Move folder' })).not.toBeInTheDocument();
  });
});
