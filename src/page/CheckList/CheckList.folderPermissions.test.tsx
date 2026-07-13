import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { BASIC_PING_CHECK } from 'test/fixtures/checks';
import {
  CHECK_IN_EXTERNAL_FOLDER,
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

      it('shows checks in readable folders outside the default folder subtree', async () => {
        await renderCheckList([...ALL_CHECKS, CHECK_IN_EXTERNAL_FOLDER]);
        await screen.findByText('Production HTTP check');
        expect(await screen.findByText('External folder check')).toBeInTheDocument();
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

      it('enables edit and delete for checks in an editable folder (folder Edit grants delete, same as dashboards)', async () => {
        await renderCheckList([CHECK_IN_PRODUCTION]);

        await waitFor(() => {
          expect(screen.getByLabelText('Edit check')).not.toHaveAttribute('aria-disabled', 'true');
        });

        expect(screen.getByLabelText('Delete check')).not.toBeDisabled();
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

  describe('graceful degradation — folders enabled but user lacks folders:read', () => {
    beforeEach(() => mockFeatureToggles({ [FeatureName.Folders]: true }));

    const renderWithFolders403 = async (checks: Check[] = ALL_CHECKS) => {
      server.use(
        apiRoute(`listChecks`, {
          result: () => ({ json: checks }),
        }),
        apiRoute(`listProbes`, {
          result: () => ({ json: [PRIVATE_PROBE, PUBLIC_PROBE] }),
        }),
        apiRoute(`getFolder`, {
          result: () => ({ status: 403, json: { message: 'Access denied' } }),
        }),
        apiRoute(`listFolders`, {
          result: () => ({ status: 403, json: { message: 'Access denied' } }),
        })
      );

      return render(<CheckList />, {
        route: AppRoutes.Checks,
        path: generateRoutePath(AppRoutes.Checks),
      });
    };

    it('shows all checks including those with folderUids', async () => {
      await renderWithFolders403();
      await screen.findByText(/Folder features are unavailable/);
      expect(screen.getByText('Production HTTP check')).toBeInTheDocument();
      expect(screen.getByText('Staging DNS check')).toBeInTheDocument();
      expect(screen.getByText('Forbidden folder check')).toBeInTheDocument();
      expect(screen.getByText('Unassigned check')).toBeInTheDocument();
    });

    it('uses SM RBAC for action buttons (folder permissions do not apply)', async () => {
      await renderWithFolders403([CHECK_IN_READONLY_FOLDER]);
      const editButton = await screen.findByLabelText('Edit check');
      const deleteButton = screen.getByLabelText('Delete check');

      expect(editButton).not.toHaveAttribute('aria-disabled', 'true');
      expect(deleteButton).not.toBeDisabled();
    });

    it('shows a dismissible permission banner for 403', async () => {
      const { user } = await renderWithFolders403();
      const alert = await screen.findByText(/Folder features are unavailable/);
      expect(alert).toBeInTheDocument();
      expect(screen.getByText(/folders:read/)).toBeInTheDocument();

      const closeButton = screen.getByLabelText('Close alert');
      await user.click(closeButton);
      expect(screen.queryByText(/Folder features are unavailable/)).not.toBeInTheDocument();
    });

    it('shows a creation-needed banner when the default folder does not exist', async () => {
      server.use(
        apiRoute(`listChecks`, {
          result: () => ({ json: ALL_CHECKS }),
        }),
        apiRoute(`listProbes`, {
          result: () => ({ json: [PRIVATE_PROBE, PUBLIC_PROBE] }),
        }),
        apiRoute(`getFolder`, {
          result: () => ({ status: 404, json: { message: 'Folder not found' } }),
        }),
        apiRoute(`listFolders`, {
          result: () => ({ json: [] }),
        })
      );

      render(<CheckList />, {
        route: AppRoutes.Checks,
        path: generateRoutePath(AppRoutes.Checks),
      });

      expect(await screen.findByText(/has not been created yet/)).toBeInTheDocument();
    });

    it('hides the folder view option in the view switcher', async () => {
      await renderWithFolders403();
      await screen.findByText('Production HTTP check');
      expect(screen.queryByLabelText('Folder view')).not.toBeInTheDocument();
    });
  });

  describe('graceful degradation — folders enabled but server returns 500', () => {
    beforeEach(() => mockFeatureToggles({ [FeatureName.Folders]: true }));

    const renderWithFolders500 = async (checks: Check[] = ALL_CHECKS) => {
      server.use(
        apiRoute(`listChecks`, {
          result: () => ({ json: checks }),
        }),
        apiRoute(`listProbes`, {
          result: () => ({ json: [PRIVATE_PROBE, PUBLIC_PROBE] }),
        }),
        apiRoute(`getFolder`, {
          result: () => ({ status: 500, json: { message: 'Internal server error' } }),
        }),
        apiRoute(`listFolders`, {
          result: () => ({ status: 500, json: { message: 'Internal server error' } }),
        })
      );

      return render(<CheckList />, {
        route: AppRoutes.Checks,
        path: generateRoutePath(AppRoutes.Checks),
      });
    };

    it('shows the error banner (not the permission banner) for non-403 failures', async () => {
      await renderWithFolders500();
      const errorAlert = await screen.findByText(/Failed to load folder information/);
      expect(errorAlert).toBeInTheDocument();
      expect(screen.getByText(/Something went wrong while loading folders/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();

      expect(screen.queryByText(/folders:read/)).not.toBeInTheDocument();
    });

    it('shows all checks despite the folder error', async () => {
      await renderWithFolders500();
      await screen.findByText(/Failed to load folder information/);
      expect(screen.getByText('Production HTTP check')).toBeInTheDocument();
      expect(screen.getByText('Staging DNS check')).toBeInTheDocument();
      expect(screen.getByText('Forbidden folder check')).toBeInTheDocument();
      expect(screen.getByText('Unassigned check')).toBeInTheDocument();
    });

    it('uses SM RBAC for action buttons when folders error', async () => {
      await renderWithFolders500([CHECK_IN_READONLY_FOLDER]);
      const editButton = await screen.findByLabelText('Edit check');
      const deleteButton = screen.getByLabelText('Delete check');

      expect(editButton).not.toHaveAttribute('aria-disabled', 'true');
      expect(deleteButton).not.toBeDisabled();
    });
  });

  describe('graceful degradation — folder creation denied (403 on create)', () => {
    beforeEach(() => mockFeatureToggles({ [FeatureName.Folders]: true }));

    // jest.replaceProperty is reset in afterEach in jest-setup.js
    const grantFoldersCreate = () => {
      const runtime = require('@grafana/runtime');
      jest.replaceProperty(runtime, 'config', {
        ...runtime.config,
        bootData: {
          ...runtime.config.bootData,
          user: {
            ...runtime.config.bootData.user,
            permissions: {
              ...runtime.config.bootData.user.permissions,
              'folders:create': true,
            },
          },
        },
      });
    };

    const renderWithCreateDenied = () => {
      server.use(
        apiRoute(`listChecks`, {
          result: () => ({ json: ALL_CHECKS }),
        }),
        apiRoute(`listProbes`, {
          result: () => ({ json: [PRIVATE_PROBE, PUBLIC_PROBE] }),
        }),
        apiRoute(`getFolder`, {
          result: () => ({ status: 404, json: { message: 'Folder not found' } }),
        }),
        apiRoute(`listFolders`, {
          result: () => ({ json: [] }),
        }),
        apiRoute(`createFolder`, {
          result: () => ({ status: 403, json: { message: 'Access denied' } }),
        })
      );

      return render(<CheckList />, {
        route: AppRoutes.Checks,
        path: generateRoutePath(AppRoutes.Checks),
      });
    };

    it('shows the creation-needed banner (not the permission or generic error banner) when creation is denied', async () => {
      grantFoldersCreate();
      renderWithCreateDenied();

      expect(await screen.findByText(/has not been created yet/)).toBeInTheDocument();
      expect(screen.queryByText(/folders:read/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Failed to load folder information/)).not.toBeInTheDocument();
    });

    it('still shows all checks without folder grouping', async () => {
      grantFoldersCreate();
      renderWithCreateDenied();

      await screen.findByText(/has not been created yet/);
      expect(screen.getByText('Production HTTP check')).toBeInTheDocument();
      expect(screen.getByText('Forbidden folder check')).toBeInTheDocument();
      expect(screen.getByText('Unassigned check')).toBeInTheDocument();
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
