import React from 'react';
import { screen, waitFor } from '@testing-library/react';
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
  test('default folder is a pinned-first top-level node with its subfolders nested inside', () => {
    const { folderTree } = buildChecksByFolder(FOLDER_CHECKS, MOCK_FOLDERS, DEFAULT_FOLDER.uid);

    expect(folderTree[0].folderUid).toBe(DEFAULT_FOLDER.uid);
    expect(folderTree[0].isDefault).toBe(true);

    const childUids = folderTree[0].children.map((c) => c.folderUid);
    expect(childUids).toContain(FOLDER_PRODUCTION.uid);
    expect(childUids).toContain(FOLDER_STAGING.uid);
  });

  test('checks without folderUid land in the default folder node', () => {
    const { folderTree, rootChecks } = buildChecksByFolder(FOLDER_CHECKS, MOCK_FOLDERS, DEFAULT_FOLDER.uid);

    expect(rootChecks).toHaveLength(0);
    const defaultNode = folderTree.find((n) => n.isDefault);
    expect(defaultNode!.checks.map((c) => c.job)).toContain(CHECK_WITHOUT_FOLDER.job);
  });

  test('checks explicitly assigned to the default folder land in its node', () => {
    const checkInDefault: Check = { ...BASIC_HTTP_CHECK, id: 200, folderUid: DEFAULT_FOLDER.uid };
    const { folderTree, rootChecks } = buildChecksByFolder([checkInDefault], MOCK_FOLDERS, DEFAULT_FOLDER.uid);

    expect(rootChecks).toHaveLength(0);
    const defaultNode = folderTree.find((n) => n.isDefault);
    expect(defaultNode!.checks.map((c) => c.id)).toEqual([200]);
  });

  test('child folders of the default folder nest under it with their checks', () => {
    const { folderTree } = buildChecksByFolder(FOLDER_CHECKS, MOCK_FOLDERS, DEFAULT_FOLDER.uid);

    const defaultNode = folderTree.find((n) => n.isDefault);
    const productionNode = defaultNode!.children.find((n) => n.folderUid === FOLDER_PRODUCTION.uid);
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

  test('does not include empty folders in the tree', () => {
    const { folderTree } = buildChecksByFolder([CHECK_IN_PRODUCTION], MOCK_FOLDERS, DEFAULT_FOLDER.uid);

    const allUids = collectAllFolderUids(folderTree);
    expect(allUids).toContain(FOLDER_PRODUCTION.uid);
    expect(allUids).not.toContain(FOLDER_STAGING.uid);
    expect(allUids).not.toContain(FOLDER_READONLY.uid);
    expect(allUids).not.toContain(FOLDER_DELETABLE.uid);
  });

  test('keeps empty ancestors of check-bearing folders so nesting stays intact', () => {
    const { folderTree } = buildChecksByFolder([CHECK_IN_PRODUCTION], MOCK_FOLDERS, DEFAULT_FOLDER.uid);

    const defaultNode = folderTree.find((n) => n.isDefault);
    expect(defaultNode).toBeDefined();
    expect(defaultNode!.checks).toHaveLength(0);
    expect(defaultNode!.children.map((n) => n.folderUid)).toEqual([FOLDER_PRODUCTION.uid]);
  });

  test('omits the default folder when nothing lives in its subtree', () => {
    const { folderTree } = buildChecksByFolder([CHECK_IN_EXTERNAL_FOLDER], MOCK_FOLDERS, DEFAULT_FOLDER.uid, false, [
      FOLDER_EXTERNAL,
    ]);

    expect(folderTree.map((n) => n.folderUid)).toEqual([FOLDER_EXTERNAL.uid]);
  });

  test('reverses folder sort order when reverseFolderSort is true', () => {
    const checks = [CHECK_IN_PRODUCTION, CHECK_IN_STAGING];
    const { folderTree: aToZ } = buildChecksByFolder(checks, MOCK_FOLDERS, DEFAULT_FOLDER.uid, false);
    const { folderTree: zToA } = buildChecksByFolder(checks, MOCK_FOLDERS, DEFAULT_FOLDER.uid, true);

    const titlesAZ = aToZ.find((n) => n.isDefault)!.children.map((n) => n.folder?.title);
    const titlesZA = zToA.find((n) => n.isDefault)!.children.map((n) => n.folder?.title);

    expect(titlesAZ).toEqual([FOLDER_PRODUCTION.title, FOLDER_STAGING.title]);
    expect(titlesZA).toEqual([...titlesAZ].reverse());
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
    expect(externalNode!.isOutside).toBe(true);
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

    test('renders checks in a readable folder outside the default subtree as a top-level group', async () => {
      await renderCheckList([CHECK_IN_PRODUCTION, CHECK_IN_EXTERNAL_FOLDER], 'view=folder');

      // The external fixture duplicates the default folder's title (the
      // stranded-folder incident scenario); the default node is suffixed,
      // the stranded duplicate renders as a plain top-level group — its
      // position in the hierarchy says where it lives, no badge needed.
      expect(await screen.findByText(FOLDER_EXTERNAL.title)).toBeInTheDocument();
      expect(screen.getByText(`${FOLDER_EXTERNAL.title} (default)`)).toBeInTheDocument();
      expect(screen.queryByText('Root')).not.toBeInTheDocument();
      expect(screen.getByText('External folder check')).toBeInTheDocument();
      expect(screen.queryByText('Folder not found')).not.toBeInTheDocument();
    });

    test('does not render empty folders', async () => {
      await renderCheckList([CHECK_IN_PRODUCTION]);

      expect(await screen.findByText('Production')).toBeInTheDocument();
      expect(screen.queryByText('Staging')).not.toBeInTheDocument();
      expect(screen.queryByText('0 checks')).not.toBeInTheDocument();
    });

    test('does not render the default folder when its subtree has no checks', async () => {
      await renderCheckList([CHECK_IN_EXTERNAL_FOLDER], 'view=folder');

      expect(await screen.findByText('External folder check')).toBeInTheDocument();
      expect(screen.queryByText(`${FOLDER_EXTERNAL.title} (default)`)).not.toBeInTheDocument();
    });

    test('a single button toggles between collapsing and expanding all folders', async () => {
      const { user } = await renderCheckList([CHECK_IN_PRODUCTION]);

      // Wait for the default folder group: once it renders, the tree has
      // settled and check rows will not remount into it anymore.
      expect(await screen.findByText(/\(default\)/)).toBeInTheDocument();
      expect(await screen.findByText('Production HTTP check')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Collapse all folders' }));
      expect(screen.queryByText('Production HTTP check')).not.toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Expand all folders' }));
      expect(await screen.findByText('Production HTTP check')).toBeInTheDocument();
    });

    test('the toggle tracks only folders currently in the tree, ignoring stale collapsed ones', async () => {
      const { user } = await renderCheckList([CHECK_IN_PRODUCTION, CHECK_WITH_ORPHANED_FOLDER]);

      // Collapse the orphaned folder; its node only exists while its check
      // is in the list.
      expect(await screen.findByText('Orphaned folder check')).toBeInTheDocument();
      await user.click(screen.getByLabelText('Collapse folder deleted-folder-uid'));

      // Filter its check out: the folder leaves the tree (the count drops)
      // but its UID stays in the collapsed set. Every folder still shown is
      // expanded, so the toggle must offer to collapse, not report a
      // collapsed state. Only the default folder and Production remain —
      // empty folders never render.
      const searchInput = screen.getByPlaceholderText('Search by job name, endpoint, or label');
      await user.type(searchInput, CHECK_IN_PRODUCTION.job);
      await waitFor(() => expect(screen.getByText(/Folders \(2\)/)).toBeInTheDocument());

      expect(screen.getByRole('button', { name: 'Collapse all folders' })).toBeInTheDocument();
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
