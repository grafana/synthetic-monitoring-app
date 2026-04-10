import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { trackCheckUpdated } from 'features/tracking/checkFormEvents';
import { CHECKSTER_TEST_ID, DataTestIds } from 'test/dataTestIds';
import { BASIC_DNS_CHECK, BASIC_HTTP_CHECK } from 'test/fixtures/checks';
import { FOLDER_FORBIDDEN_UID, FOLDER_READONLY } from 'test/fixtures/folders';
import { apiRoute } from 'test/handlers';
import { render } from 'test/render';
import { server } from 'test/server';
import { mockFeatureToggles, runTestAsRBACReader, runTestAsViewer } from 'test/utils';

import { Check, CheckType, FeatureName } from 'types';
import { AppRoutes } from 'routing/types';
import { generateRoutePath } from 'routing/utils';
import { renderEditForm } from 'page/__testHelpers__/checkForm';
import { EditCheckV2 } from 'page/EditCheck/EditCheckV2';

import { submitForm } from '../../../../components/Checkster/__testHelpers__/formHelpers';

jest.mock('features/tracking/checkFormEvents', () => ({
  trackCheckCreated: jest.fn(),
  trackCheckUpdated: jest.fn(),
  trackNavigateWizardForm: jest.fn(),
  trackAdhocCreated: jest.fn(),
  trackNeedHelpScriptsButtonClicked: jest.fn(),
}));

describe(`<EditCheckV2 />`, () => {
  it(`renders the can't find check modal when given a bad check id`, async () => {
    await renderEditForm(-1);
    expect(screen.getByText(/We were unable to find your check/)).toBeInTheDocument();
  });

  it(`renders the error modal when unable to fetch the check`, async () => {
    server.use(
      apiRoute(`listChecks`, {
        result: () => {
          return {
            status: 500,
          };
        },
      })
    );

    await renderEditForm(BASIC_HTTP_CHECK.id);
    expect(screen.getByText(/An error has occurred/)).toBeInTheDocument();
  });

  it(`should not show the limits warning when the limits are reached`, async () => {
    server.use(
      apiRoute('getTenantLimits', {
        result: () => {
          return {
            json: {
              MaxChecks: 1,
              MaxScriptedChecks: 10,
              MaxMetricLabels: 16,
              MaxLogLabels: 13,
              maxAllowedMetricLabels: 10,
              maxAllowedLogLabels: 5,
            },
          };
        },
      })
    );

    await renderEditForm(BASIC_HTTP_CHECK.id);
    expect(screen.queryByText(/Check limit reached/)).not.toBeInTheDocument();
  });

  it(`disables the form when the user is a viewer`, async () => {
    runTestAsViewer();
    await renderEditForm(BASIC_HTTP_CHECK.id);
    expect(screen.getByLabelText(/Job name \*/)).toBeDisabled();
  });

  it(`disables the form when the user is a RBAC viewer`, async () => {
    runTestAsRBACReader();
    await renderEditForm(BASIC_HTTP_CHECK.id);
    const submitButton = await screen.findByTestId(CHECKSTER_TEST_ID.form.submitButton);
    expect(submitButton).toBeDisabled();
  });

  it(`disables the save button when no edits have been made`, async () => {
    await renderEditForm(BASIC_HTTP_CHECK.id);
    expect(await screen.findByTestId(CHECKSTER_TEST_ID.form.submitButton)).not.toBeEnabled();
  });

  it(`should redirect to the check dashboard when the check is updated`, async () => {
    const { user } = await renderEditForm(BASIC_DNS_CHECK.id);

    const jobNameInput = await screen.findByLabelText('Job name', { exact: false });
    await user.type(jobNameInput, `updated job name`);

    await submitForm(user);

    await waitFor(() => {
      const pathInfo = screen.getByTestId(DataTestIds.TestRouterInfoPathname);
      expect(pathInfo.textContent).toBe(generateRoutePath(AppRoutes.CheckDashboard, { id: BASIC_DNS_CHECK.id! }));
    });
  });

  it(`should track check update with check type`, async () => {
    const { user } = await renderEditForm(BASIC_DNS_CHECK.id);

    const jobNameInput = await screen.findByLabelText('Job name', { exact: false });
    await user.type(jobNameInput, `updated job name`);

    await submitForm(user);

    await waitFor(() => {
      const pathInfo = screen.getByTestId(DataTestIds.TestRouterInfoPathname);
      expect(pathInfo.textContent).toBe(generateRoutePath(AppRoutes.CheckDashboard, { id: BASIC_DNS_CHECK.id! }));
    });

    expect(trackCheckUpdated).toHaveBeenCalledWith({ checkType: CheckType.Dns });
  });

  describe('folder permissions', () => {
    const CHECK_IN_READONLY_FOLDER: Check = { ...BASIC_HTTP_CHECK, folderUid: FOLDER_READONLY.uid };
    const CHECK_IN_FORBIDDEN_FOLDER: Check = { ...BASIC_HTTP_CHECK, folderUid: FOLDER_FORBIDDEN_UID };

    const renderEditPage = (check: Check) => {
      server.use(apiRoute(`listChecks`, { result: () => ({ json: [check] }) }));

      return render(<EditCheckV2 />, {
        route: AppRoutes.EditCheck,
        path: generateRoutePath(AppRoutes.EditCheck, { id: check.id! }),
      });
    };

    describe('with folders feature enabled', () => {
      beforeEach(() => mockFeatureToggles({ [FeatureName.Folders]: true }));

      it('redirects when the check is in a forbidden folder', async () => {
        await renderEditPage(CHECK_IN_FORBIDDEN_FOLDER);

        await waitFor(() => {
          const pathInfo = screen.getByTestId(DataTestIds.TestRouterInfoPathname);
          expect(pathInfo.textContent).not.toContain('/edit');
        });
      });

      it('disables the form for a check in a read-only folder', async () => {
        await renderEditPage(CHECK_IN_READONLY_FOLDER);

        await waitFor(() => screen.getByTestId(DataTestIds.PageReady), { timeout: 10000 });

        const submitButton = await screen.findByTestId(CHECKSTER_TEST_ID.form.submitButton);
        expect(submitButton).toBeDisabled();
      });

      it('enables the form for a check without a folderUid', async () => {
        await renderEditPage({ ...BASIC_HTTP_CHECK, folderUid: undefined });

        await waitFor(() => screen.getByTestId(DataTestIds.PageReady), { timeout: 10000 });

        const jobNameInput = await screen.findByLabelText('Job name', { exact: false });
        expect(jobNameInput).not.toBeDisabled();
      });
    });

    describe('with folders feature disabled', () => {
      it('uses SM RBAC only — form is enabled for a check in a read-only folder', async () => {
        await renderEditPage(CHECK_IN_READONLY_FOLDER);

        await waitFor(() => screen.getByTestId(DataTestIds.PageReady), { timeout: 10000 });

        const jobNameInput = await screen.findByLabelText('Job name', { exact: false });
        expect(jobNameInput).not.toBeDisabled();
      });
    });
  });
});
