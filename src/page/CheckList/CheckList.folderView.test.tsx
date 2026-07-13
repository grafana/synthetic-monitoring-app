import React from 'react';
import { screen } from '@testing-library/react';
import { CHECKS_TEST_ID } from 'test/dataTestIds';
import { BASIC_HTTP_CHECK } from 'test/fixtures/checks';
import {
  CHECK_IN_EXTERNAL_FOLDER,
  CHECK_IN_PRODUCTION,
  CHECK_IN_STAGING,
  CHECK_WITH_ORPHANED_FOLDER,
  CHECK_WITHOUT_FOLDER,
} from 'test/fixtures/folderChecks';
import {
  DEFAULT_FOLDER,
  FOLDER_DELETABLE,
  FOLDER_EXTERNAL,
  FOLDER_PRODUCTION,
  FOLDER_READONLY,
  FOLDER_STAGING,
  MOCK_FOLDERS,
} from 'test/fixtures/folders';
import { PRIVATE_PROBE, PUBLIC_PROBE } from 'test/fixtures/probes';
import { apiRoute } from 'test/handlers';
import { render } from 'test/render';
import { server } from 'test/server';
import { mockFeatureToggles } from 'test/utils';

import { Check, FeatureName } from 'types';
import { AppRoutes } from 'routing/types';
import { generateRoutePath } from 'routing/utils';
import { buildChecksByFolder, collectAllFolderUids } from 'hooks/useChecksByFolder';

import { CheckList } from './CheckList';

const FOLDER_CHECKS = [CHECK_IN_PRODUCTION, CHECK_IN_STAGING, CHECK_WITHOUT_FOLDER];

const renderCheckList = async (checks: Check[] = FOLDER_CHECKS, searchParams = '') => {
  server.use(
    apiRoute(`listChecks`, {
      result: () => ({
        json: checks,
      }),
    }),
    apiRoute(`listProbes`, {
      result: () => ({
        json: [PRIVATE_PROBE, PUBLIC_PROBE],
      }),
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

describe('buildChecksByFolder', () => {
  test('default folder is unwrapped -- its children are promoted to root level', () => {
    const { folderTree } = buildChecksByFolder(FOLDER_CHECKS, MOCK_FOLDERS, DEFAULT_FOLDER.uid);

    const allUids = collectAllFolderUids(folderTree);
    expect(allUids).not.toContain(DEFAULT_FOLDER.uid);
    expect(allUids).toContain(FOLDER_PRODUCTION.uid);
    expect(allUids).toContain(FOLDER_STAGING.uid);
  });

  test('checks without folderUid become rootChecks (unassigned)', () => {
    const { rootChecks } = buildChecksByFolder(FOLDER_CHECKS, MOCK_FOLDERS, DEFAULT_FOLDER.uid);

    expect(rootChecks).toHaveLength(1);
    expect(rootChecks[0].job).toBe(CHECK_WITHOUT_FOLDER.job);
  });

  test('checks explicitly assigned to the default folder also become rootChecks', () => {
    const checkInDefault: Check = { ...BASIC_HTTP_CHECK, id: 200, folderUid: DEFAULT_FOLDER.uid };
    const { rootChecks } = buildChecksByFolder([checkInDefault], MOCK_FOLDERS, DEFAULT_FOLDER.uid);

    expect(rootChecks).toHaveLength(1);
    expect(rootChecks[0].id).toBe(200);
  });

  test('child folders of the default folder appear at root level with their checks', () => {
    const { folderTree } = buildChecksByFolder(FOLDER_CHECKS, MOCK_FOLDERS, DEFAULT_FOLDER.uid);

    const productionNode = folderTree.find((n) => n.folderUid === FOLDER_PRODUCTION.uid);
    expect(productionNode).toBeDefined();
    expect(productionNode!.checks).toHaveLength(1);
  });

  test('marks orphaned folders', () => {
    const { folderTree } = buildChecksByFolder([CHECK_WITH_ORPHANED_FOLDER], MOCK_FOLDERS);

    const orphanedNode = folderTree.find((n) => n.folderUid === 'deleted-folder-uid');
    expect(orphanedNode).toBeDefined();
    expect(orphanedNode!.isOrphaned).toBe(true);
  });

  test('returns empty rootChecks when no defaultFolderUid and all checks have folders', () => {
    const { rootChecks } = buildChecksByFolder([CHECK_IN_PRODUCTION, CHECK_IN_STAGING], MOCK_FOLDERS);

    expect(rootChecks).toHaveLength(0);
  });

  test('includes empty folders in the tree', () => {
    const { folderTree } = buildChecksByFolder([CHECK_IN_PRODUCTION], MOCK_FOLDERS, DEFAULT_FOLDER.uid);

    const allUids = collectAllFolderUids(folderTree);
    expect(allUids).toContain(FOLDER_PRODUCTION.uid);
    expect(allUids).toContain(FOLDER_STAGING.uid);
    expect(allUids).toContain(FOLDER_READONLY.uid);
    expect(allUids).toContain(FOLDER_DELETABLE.uid);
  });

  test('sorts empty folders after folders with checks', () => {
    const { folderTree } = buildChecksByFolder([CHECK_IN_PRODUCTION], MOCK_FOLDERS, DEFAULT_FOLDER.uid);

    const titles = folderTree.map((n) => n.folder?.title);
    const productionIndex = titles.indexOf(FOLDER_PRODUCTION.title);
    const emptyFolderTitles = [FOLDER_STAGING.title, FOLDER_READONLY.title, FOLDER_DELETABLE.title];
    const emptyIndices = emptyFolderTitles.map((t) => titles.indexOf(t));

    emptyIndices.forEach((emptyIdx) => {
      expect(emptyIdx).toBeGreaterThan(productionIndex);
    });
  });

  test('sorts empty folders alphabetically among themselves', () => {
    const { folderTree } = buildChecksByFolder([CHECK_IN_PRODUCTION], MOCK_FOLDERS, DEFAULT_FOLDER.uid);

    const emptyNodes = folderTree.filter((n) => n.checks.length === 0 && n.children.length === 0);
    const titles = emptyNodes.map((n) => n.folder?.title ?? n.folderUid);
    const sorted = [...titles].sort((a, b) => a.localeCompare(b));
    expect(titles).toEqual(sorted);
  });

  test('reverses folder sort order when reverseFolderSort is true', () => {
    const { folderTree: aToZ } = buildChecksByFolder([CHECK_IN_PRODUCTION], MOCK_FOLDERS, DEFAULT_FOLDER.uid, false);
    const { folderTree: zToA } = buildChecksByFolder([CHECK_IN_PRODUCTION], MOCK_FOLDERS, DEFAULT_FOLDER.uid, true);

    const titlesAZ = aToZ.map((n) => n.folder?.title ?? n.folderUid);
    const titlesZA = zToA.map((n) => n.folder?.title ?? n.folderUid);

    const nonEmptyAZ = aToZ.filter((n) => n.checks.length > 0).map((n) => n.folder?.title);
    const nonEmptyZA = zToA.filter((n) => n.checks.length > 0).map((n) => n.folder?.title);
    expect(nonEmptyZA).toEqual([...nonEmptyAZ].reverse());

    const emptyAZ = aToZ.filter((n) => n.checks.length === 0).map((n) => n.folder?.title);
    const emptyZA = zToA.filter((n) => n.checks.length === 0).map((n) => n.folder?.title);
    expect(emptyZA).toEqual([...emptyAZ].reverse());

    expect(titlesZA).not.toEqual(titlesAZ);
  });

  test('returns orphaned nodes when folders list is empty', () => {
    const { folderTree, rootChecks } = buildChecksByFolder(FOLDER_CHECKS, []);

    expect(rootChecks).toHaveLength(1);
    expect(rootChecks[0].job).toBe(CHECK_WITHOUT_FOLDER.job);
    expect(folderTree).toHaveLength(2);
    folderTree.forEach((node) => {
      expect(node.isOrphaned).toBe(true);
    });
  });

  test('external folders referenced by checks appear at top level flagged as external', () => {
    const { folderTree } = buildChecksByFolder([CHECK_IN_EXTERNAL_FOLDER], MOCK_FOLDERS, DEFAULT_FOLDER.uid, false, [
      FOLDER_EXTERNAL,
    ]);

    const externalNode = folderTree.find((n) => n.folderUid === FOLDER_EXTERNAL.uid);
    expect(externalNode).toBeDefined();
    expect(externalNode!.isExternal).toBe(true);
    expect(externalNode!.isOrphaned).toBe(false);
    expect(externalNode!.isAccessible).toBe(true);
    expect(externalNode!.folder?.title).toBe(FOLDER_EXTERNAL.title);
    expect(externalNode!.checks).toHaveLength(1);
  });

  test('external folders without checks do not get nodes', () => {
    const { folderTree } = buildChecksByFolder([CHECK_IN_PRODUCTION], MOCK_FOLDERS, DEFAULT_FOLDER.uid, false, [
      FOLDER_EXTERNAL,
    ]);

    expect(collectAllFolderUids(folderTree)).not.toContain(FOLDER_EXTERNAL.uid);
  });

  test('external folder ancestors outside SM folder data do not create bogus nodes', () => {
    const nestedExternal = { ...FOLDER_EXTERNAL, uid: 'external-child', parentUid: 'unknown-parent' };
    const checkInNested: Check = { ...CHECK_IN_EXTERNAL_FOLDER, folderUid: nestedExternal.uid };

    const { folderTree } = buildChecksByFolder([checkInNested], MOCK_FOLDERS, DEFAULT_FOLDER.uid, false, [
      nestedExternal,
    ]);

    const allUids = collectAllFolderUids(folderTree);
    expect(allUids).toContain(nestedExternal.uid);
    expect(allUids).not.toContain('unknown-parent');
  });
});

describe('CheckList - Folder View Integration', () => {
  describe('with folders feature enabled', () => {
    beforeEach(() => mockFeatureToggles({ [FeatureName.Folders]: true }));

    test('folder view option appears in the view switcher', async () => {
      await renderCheckList();
      expect(screen.getByTitle('Folder view')).toBeInTheDocument();
    });

    test('folder view renders when view=folder is in URL', async () => {
      await renderCheckList(FOLDER_CHECKS, 'view=folder');

      expect(await screen.findByText(/Folders/)).toBeInTheDocument();
    });

    test('renders checks in a readable folder outside the default subtree with a badge', async () => {
      await renderCheckList([CHECK_IN_PRODUCTION, CHECK_IN_EXTERNAL_FOLDER], 'view=folder');

      // The external fixture duplicates the default folder's title (the
      // stranded-folder incident scenario); the default node is suffixed.
      expect(await screen.findByText(FOLDER_EXTERNAL.title)).toBeInTheDocument();
      expect(screen.getByText(`${FOLDER_EXTERNAL.title} (default)`)).toBeInTheDocument();
      expect(await screen.findByText('Outside default folder')).toBeInTheDocument();
      expect(screen.getByText('External folder check')).toBeInTheDocument();
      expect(screen.queryByText('Folder not found')).not.toBeInTheDocument();
    });

    test('shows empty folders with 0 checks', async () => {
      await renderCheckList([CHECK_IN_PRODUCTION]);

      expect(await screen.findByText('Production')).toBeInTheDocument();
      expect(screen.getByText('Staging')).toBeInTheDocument();
      expect(screen.getAllByText('0 checks').length).toBeGreaterThan(0);
    });

    test('selecting an empty folder reveals the delete action', async () => {
      const { user } = await renderCheckList([CHECK_IN_PRODUCTION]);

      expect(await screen.findByText('Staging')).toBeInTheDocument();

      const emptyCheckbox = screen.getByLabelText('Select folder Staging');
      expect(emptyCheckbox).toBeEnabled();
      expect(screen.queryByRole('button', { name: 'Delete folder' })).not.toBeInTheDocument();

      await user.click(emptyCheckbox);
      expect(screen.getByRole('button', { name: 'Delete folder' })).toBeInTheDocument();
    });

    test('deselecting an empty folder hides the delete action', async () => {
      const { user } = await renderCheckList([CHECK_IN_PRODUCTION]);

      expect(await screen.findByText('Staging')).toBeInTheDocument();

      const emptyCheckbox = screen.getByLabelText('Select folder Staging');
      await user.click(emptyCheckbox);
      expect(screen.getByRole('button', { name: 'Delete folder' })).toBeInTheDocument();

      await user.click(emptyCheckbox);
      expect(screen.queryByRole('button', { name: 'Delete folder' })).not.toBeInTheDocument();
    });
  });

  describe('with folders feature disabled', () => {
    test('folder view option does not appear in the view switcher', async () => {
      await renderCheckList();
      expect(screen.queryByTitle('Folder view')).not.toBeInTheDocument();
    });
  });
});

describe('CheckList - Folder Badge', () => {
  describe('with folders feature enabled', () => {
    beforeEach(() => mockFeatureToggles({ [FeatureName.Folders]: true }));

    test('does not display folder badge on check cards', async () => {
      await renderCheckList([CHECK_IN_PRODUCTION], 'view=card');

      await screen.findByTestId(CHECKS_TEST_ID.card);
      expect(screen.queryByText(FOLDER_PRODUCTION.title)).not.toBeInTheDocument();
    });

    test('does not display badge for orphaned folder in card view', async () => {
      await renderCheckList([CHECK_WITH_ORPHANED_FOLDER], 'view=card');

      await screen.findByTestId(CHECKS_TEST_ID.card);
      expect(screen.queryByText('Folder deleted')).not.toBeInTheDocument();
    });

    test('does not display folder badge for checks without a folder', async () => {
      await renderCheckList([CHECK_WITHOUT_FOLDER], 'view=card');

      await screen.findByTestId(CHECKS_TEST_ID.card);
      expect(screen.queryByText('Folder deleted')).not.toBeInTheDocument();
    });
  });

  describe('with folders feature disabled', () => {
    test('does not display folder badge even when check has folderUid', async () => {
      await renderCheckList([CHECK_IN_PRODUCTION]);

      await screen.findByTestId(CHECKS_TEST_ID.card);
      expect(screen.queryByText(FOLDER_PRODUCTION.title)).not.toBeInTheDocument();
    });
  });
});
