import { screen, waitFor } from '@testing-library/react';
import { trackCheckUpdated } from 'features/tracking/checkFormEvents';
import { CHECKSTER_TEST_ID, DataTestIds } from 'test/dataTestIds';
import { BASIC_DNS_CHECK, BASIC_HTTP_CHECK } from 'test/fixtures/checks';
import { apiRoute } from 'test/handlers';
import { server } from 'test/server';
import { runTestAsRBACReader, runTestAsViewer } from 'test/utils';

import { CheckType } from 'types';
import { AppRoutes } from 'routing/types';
import { generateRoutePath } from 'routing/utils';
import { renderEditFormV2 } from 'page/__testHelpers__/checkForm';

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
    await renderEditFormV2(-1);
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

    await renderEditFormV2(BASIC_HTTP_CHECK.id);
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

    await renderEditFormV2(BASIC_HTTP_CHECK.id);
    expect(screen.queryByText(/Check limit reached/)).not.toBeInTheDocument();
  });

  it(`disables the form when the user is a viewer`, async () => {
    runTestAsViewer();
    await renderEditFormV2(BASIC_HTTP_CHECK.id);
    expect(screen.getByLabelText(/Job name \*/)).toBeDisabled();
  });

  it(`disables the form when the user is a RBAC viewer`, async () => {
    runTestAsRBACReader();
    await renderEditFormV2(BASIC_HTTP_CHECK.id);
    const submitButton = await screen.findByTestId(CHECKSTER_TEST_ID.form.submitButton);
    expect(submitButton).toBeDisabled();
  });

  it(`disables the save button when no edits have been made`, async () => {
    await renderEditFormV2(BASIC_HTTP_CHECK.id);
    expect(await screen.findByTestId(CHECKSTER_TEST_ID.form.submitButton)).not.toBeEnabled();
  });

  it(`should redirect to the check dashboard when the check is updated`, async () => {
    const { user } = await renderEditFormV2(BASIC_DNS_CHECK.id);

    const jobNameInput = await screen.findByLabelText('Job name', { exact: false });
    await user.type(jobNameInput, `updated job name`);

    await submitForm(user);

    await waitFor(() => {
      const pathInfo = screen.getByTestId(DataTestIds.TEST_ROUTER_INFO_PATHNAME);
      expect(pathInfo.textContent).toBe(generateRoutePath(AppRoutes.CheckDashboard, { id: BASIC_DNS_CHECK.id! }));
    });
  });

  it(`should track check update with check type`, async () => {
    const { user } = await renderEditFormV2(BASIC_DNS_CHECK.id);

    const jobNameInput = await screen.findByLabelText('Job name', { exact: false });
    await user.type(jobNameInput, `updated job name`);

    await submitForm(user);

    await waitFor(() => {
      const pathInfo = screen.getByTestId(DataTestIds.TEST_ROUTER_INFO_PATHNAME);
      expect(pathInfo.textContent).toBe(generateRoutePath(AppRoutes.CheckDashboard, { id: BASIC_DNS_CHECK.id! }));
    });

    expect(trackCheckUpdated).toHaveBeenCalledWith({ checkType: CheckType.DNS });
  });
});
