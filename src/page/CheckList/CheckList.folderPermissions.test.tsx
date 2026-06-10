import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { BASIC_PING_CHECK } from 'test/fixtures/checks';
import {
  CHECK_IN_FORBIDDEN_FOLDER,
  CHECK_IN_PRODUCTION,
  CHECK_IN_READONLY_FOLDER,
  CHECK_IN_STAGING,
  CHECK_WITH_ORPHANED_FOLDER,
  CHECK_WITHOUT_FOLDER,
} from 'test/fixtures/folderChecks';
import { PRIVATE_PROBE, PUBLIC_PROBE } from 'test/fixtures/probes';
import { apiRoute } from 'test/handlers';
import { render } from 'test/render';
import { server } from 'test/server';
import { mockFeatureToggles, runTestAsRBACReader } from 'test/utils';

import { Check, FeatureName } from 'types';
import { AppRoutes } from 'routing/types';
import { generateRoutePath } from 'routing/utils';

import { CheckList } from './CheckList';

const CHECK_WITH_EMPTY_FOLDER_UID: Check = {
  ...BASIC_PING_CHECK,
  id: 206,
  job: 'Empty folderUid check',
  folderUid: '',
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

  return res;
};

const renderCheckListForReader = async (checks: Check[]) => {
  runTestAsRBACReader();

  server.use(
    apiRoute(`listChecks`, {
      result: () => ({ json: checks }),
    }),
    apiRoute(`listProbes`, {
      result: () => ({ json: [PRIVATE_PROBE, PUBLIC_PROBE] }),
    })
  );

  return render(<CheckList />, {
    route: AppRoutes.Checks,
    path: generateRoutePath(AppRoutes.Checks),
  });
};

describe('CheckList - Folder Permissions', () => {
  describe('with folders feature enabled', () => {
    beforeEach(() => mockFeatureToggles({ [FeatureName.Folders]: true }));

    describe('visibility', () => {
      it('shows checks in accessible folders', async () => {
        await renderCheckList();
        expect(await screen.findByText('Production HTTP check')).toBeInTheDocument();
        expect(screen.getByText('Staging DNS check')).toBeInTheDocument();
      });

      it('shows checks without a folderUid', async () => {
        await renderCheckList();
        expect(await screen.findByText('Unassigned check')).toBeInTheDocument();
      });

      it('shows checks with empty string folderUid (treated as default folder)', async () => {
        await renderCheckList([CHECK_WITH_EMPTY_FOLDER_UID]);
        expect(await screen.findByText('Empty folderUid check')).toBeInTheDocument();
      });

      it('hides checks in forbidden folders', async () => {
        await renderCheckList();
        await screen.findByText('Production HTTP check');
        expect(screen.queryByText('Forbidden folder check')).not.toBeInTheDocument();
      });

      it('shows checks with orphaned folders after resolving 404', async () => {
        await renderCheckList();
        await screen.findByText('Production HTTP check');
        expect(await screen.findByText('Orphaned folder check')).toBeInTheDocument();
      });
    });

    describe('action buttons — folder permissions is the ceiling', () => {
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

        await waitFor(() => {
          expect(screen.getByLabelText('Edit check')).not.toHaveAttribute('aria-disabled', 'true');
        });

        expect(screen.getByLabelText('Delete check')).toBeDisabled();
        expect(screen.getByLabelText('Disable check')).not.toBeDisabled();
      });

      it('uses SM RBAC for checks without a folderUid', async () => {
        await renderCheckList([CHECK_WITHOUT_FOLDER]);
        const editButton = await screen.findByLabelText('Edit check');
        const deleteButton = screen.getByLabelText('Delete check');

        expect(editButton).not.toHaveAttribute('aria-disabled', 'true');
        expect(deleteButton).not.toBeDisabled();
      });
    });

    describe('action buttons — SM RBAC is the ceiling', () => {
      it('SM reader + folder Edit = read only (all buttons disabled)', async () => {
        await renderCheckListForReader([CHECK_IN_PRODUCTION]);

        const editButton = await screen.findByLabelText('Edit check');
        expect(editButton).toHaveAttribute('aria-disabled', 'true');
        expect(screen.getByLabelText('Delete check')).toBeDisabled();
        expect(screen.getByLabelText('Disable check')).toBeDisabled();
      });
    });
  });

  describe('with folders feature disabled', () => {
    it('shows all checks regardless of folderUid', async () => {
      await renderCheckList();
      expect(await screen.findByText('Production HTTP check')).toBeInTheDocument();
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
