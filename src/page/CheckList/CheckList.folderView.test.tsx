import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { DataTestIds } from 'test/dataTestIds';
import { BASIC_DNS_CHECK, BASIC_HTTP_CHECK, BASIC_PING_CHECK } from 'test/fixtures/checks';
import { DEFAULT_FOLDER, FOLDER_PRODUCTION, FOLDER_STAGING, MOCK_FOLDERS } from 'test/fixtures/folders';
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

const CHECK_IN_PRODUCTION: Check = {
  ...BASIC_HTTP_CHECK,
  id: 100,
  job: 'Production HTTP check',
  folderUid: FOLDER_PRODUCTION.uid,
};

const CHECK_IN_STAGING: Check = {
  ...BASIC_DNS_CHECK,
  id: 101,
  job: 'Staging DNS check',
  folderUid: FOLDER_STAGING.uid,
};

const CHECK_WITHOUT_FOLDER: Check = {
  ...BASIC_PING_CHECK,
  id: 102,
  job: 'Root level ping check',
  folderUid: undefined,
};

const CHECK_WITH_ORPHANED_FOLDER: Check = {
  ...BASIC_DNS_CHECK,
  id: 103,
  job: 'Orphaned folder check',
  folderUid: 'deleted-folder-uid',
};

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
    const { rootChecks } = buildChecksByFolder(
      [CHECK_IN_PRODUCTION, CHECK_IN_STAGING],
      MOCK_FOLDERS
    );

    expect(rootChecks).toHaveLength(0);
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

    test('displays folder path badge on check cards', async () => {
      await renderCheckList([CHECK_IN_PRODUCTION]);

      expect(await screen.findByText(FOLDER_PRODUCTION.title, {}, { timeout: 5000 })).toBeInTheDocument();
    });

    test('displays "Folder deleted" badge for orphaned folder', async () => {
      await renderCheckList([CHECK_WITH_ORPHANED_FOLDER]);

      await waitFor(
        () => expect(screen.getByText('Folder deleted')).toBeInTheDocument(),
        { timeout: 5000 }
      );
    });

    test('does not display folder badge for checks without a folder', async () => {
      await renderCheckList([CHECK_WITHOUT_FOLDER]);

      await screen.findByTestId(DataTestIds.CheckCard);
      expect(screen.queryByText('Folder deleted')).not.toBeInTheDocument();
    });
  });

  describe('with folders feature disabled', () => {
    test('does not display folder badge even when check has folderUid', async () => {
      await renderCheckList([CHECK_IN_PRODUCTION]);

      await screen.findByTestId(DataTestIds.CheckCard);
      expect(screen.queryByText(FOLDER_PRODUCTION.title)).not.toBeInTheDocument();
    });
  });
});
