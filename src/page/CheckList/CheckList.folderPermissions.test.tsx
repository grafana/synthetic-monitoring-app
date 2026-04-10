import React from 'react';
import { screen } from '@testing-library/react';
import { BASIC_DNS_CHECK, BASIC_HTTP_CHECK, BASIC_PING_CHECK } from 'test/fixtures/checks';
import {
  FOLDER_FORBIDDEN_UID,
  FOLDER_PRODUCTION,
  FOLDER_READONLY,
  FOLDER_STAGING,
} from 'test/fixtures/folders';
import { PRIVATE_PROBE, PUBLIC_PROBE } from 'test/fixtures/probes';
import { apiRoute } from 'test/handlers';
import { render } from 'test/render';
import { server } from 'test/server';
import { mockFeatureToggles, runTestAsRBACReader } from 'test/utils';

import { Check, FeatureName } from 'types';
import { AppRoutes } from 'routing/types';
import { generateRoutePath } from 'routing/utils';

import { CheckList } from './CheckList';

const CHECK_IN_PRODUCTION: Check = {
  ...BASIC_HTTP_CHECK,
  id: 200,
  job: 'Production API check',
  folderUid: FOLDER_PRODUCTION.uid,
};

const CHECK_IN_STAGING: Check = {
  ...BASIC_DNS_CHECK,
  id: 201,
  job: 'Staging DNS check',
  folderUid: FOLDER_STAGING.uid,
};

const CHECK_IN_READONLY_FOLDER: Check = {
  ...BASIC_PING_CHECK,
  id: 202,
  job: 'Read-only folder check',
  folderUid: FOLDER_READONLY.uid,
};

const CHECK_IN_FORBIDDEN_FOLDER: Check = {
  ...BASIC_HTTP_CHECK,
  id: 203,
  job: 'Forbidden folder check',
  folderUid: FOLDER_FORBIDDEN_UID,
};

const CHECK_WITHOUT_FOLDER: Check = {
  ...BASIC_PING_CHECK,
  id: 204,
  job: 'Unassigned check',
  folderUid: undefined,
};

const CHECK_WITH_ORPHANED_FOLDER: Check = {
  ...BASIC_DNS_CHECK,
  id: 205,
  job: 'Orphaned folder check',
  folderUid: 'deleted-folder-uid',
};

const ALL_CHECKS = [
  CHECK_IN_PRODUCTION,
  CHECK_IN_STAGING,
  CHECK_IN_READONLY_FOLDER,
  CHECK_IN_FORBIDDEN_FOLDER,
  CHECK_WITHOUT_FOLDER,
  CHECK_WITH_ORPHANED_FOLDER,
];

const renderCheckList = async (checks: Check[] = ALL_CHECKS) => {
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

describe('CheckList - Folder Permissions', () => {
  describe('with folders feature enabled', () => {
    beforeEach(() => mockFeatureToggles({ [FeatureName.Folders]: true }));

    describe('visibility', () => {
      it('shows checks in accessible folders', async () => {
        await renderCheckList();
        expect(await screen.findByText('Production API check')).toBeInTheDocument();
        expect(screen.getByText('Staging DNS check')).toBeInTheDocument();
      });

      it('shows checks without a folderUid', async () => {
        await renderCheckList();
        expect(await screen.findByText('Unassigned check')).toBeInTheDocument();
      });

      it('hides checks in forbidden folders', async () => {
        await renderCheckList();
        await screen.findByText('Production API check');
        expect(screen.queryByText('Forbidden folder check')).not.toBeInTheDocument();
      });

      it('shows checks with orphaned folders (folder deleted)', async () => {
        await renderCheckList();
        expect(await screen.findByText('Orphaned folder check')).toBeInTheDocument();
      });
    });

    describe('action buttons — combined model: min(SM RBAC, folder permission)', () => {
      it('disables edit/delete for checks in a read-only folder (folder View)', async () => {
        await renderCheckList([CHECK_IN_READONLY_FOLDER]);
        const editButton = await screen.findByLabelText('Edit check');
        const deleteButton = screen.getByLabelText('Delete check');
        const toggleButton = screen.getByLabelText('Disable check');

        expect(editButton).toHaveAttribute('aria-disabled', 'true');
        expect(deleteButton).toBeDisabled();
        expect(toggleButton).toBeDisabled();
      });

      it('enables edit but disables delete for checks in an editable folder (folder Edit, no Admin)', async () => {
        await renderCheckList([CHECK_IN_PRODUCTION]);
        const editButton = await screen.findByLabelText('Edit check');
        const deleteButton = screen.getByLabelText('Delete check');
        const toggleButton = screen.getByLabelText('Disable check');

        expect(editButton).not.toHaveAttribute('aria-disabled', 'true');
        expect(deleteButton).toBeDisabled();
        expect(toggleButton).not.toBeDisabled();
      });

      it('uses SM RBAC for checks without a folderUid', async () => {
        await renderCheckList([CHECK_WITHOUT_FOLDER]);
        const editButton = await screen.findByLabelText('Edit check');
        const deleteButton = screen.getByLabelText('Delete check');

        expect(editButton).not.toHaveAttribute('aria-disabled', 'true');
        expect(deleteButton).not.toBeDisabled();
      });

      it('uses SM RBAC for checks with orphaned folders', async () => {
        await renderCheckList([CHECK_WITH_ORPHANED_FOLDER]);
        const editButton = await screen.findByLabelText('Edit check');
        const deleteButton = screen.getByLabelText('Delete check');

        expect(editButton).not.toHaveAttribute('aria-disabled', 'true');
        expect(deleteButton).not.toBeDisabled();
      });
    });

    describe('combined model — SM RBAC is the ceiling', () => {
      it('SM reader + folder Admin = read only (all buttons disabled)', async () => {
        runTestAsRBACReader();
        await renderCheckList([CHECK_IN_PRODUCTION]);
        const editButton = await screen.findByLabelText('Edit check');
        const deleteButton = screen.getByLabelText('Delete check');
        const toggleButton = screen.getByLabelText('Disable check');

        expect(editButton).toHaveAttribute('aria-disabled', 'true');
        expect(deleteButton).toBeDisabled();
        expect(toggleButton).toBeDisabled();
      });
    });
  });

  describe('with folders feature disabled', () => {
    it('shows all checks regardless of folderUid', async () => {
      await renderCheckList();
      expect(await screen.findByText('Production API check')).toBeInTheDocument();
      expect(screen.getByText('Forbidden folder check')).toBeInTheDocument();
      expect(screen.getByText('Unassigned check')).toBeInTheDocument();
    });

    it('uses SM RBAC only for action buttons', async () => {
      await renderCheckList([CHECK_IN_READONLY_FOLDER]);
      const editButton = await screen.findByLabelText('Edit check');
      const deleteButton = screen.getByLabelText('Delete check');

      expect(editButton).not.toHaveAttribute('aria-disabled', 'true');
      expect(deleteButton).not.toBeDisabled();
    });
  });
});
