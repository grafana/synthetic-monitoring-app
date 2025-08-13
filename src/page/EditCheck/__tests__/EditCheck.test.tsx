import { screen } from '@testing-library/react';
import { DataTestIds } from 'test/dataTestIds';
import { BASIC_DNS_CHECK, BASIC_HTTP_CHECK } from 'test/fixtures/checks';
import { apiRoute } from 'test/handlers';
import { server } from 'test/server';
import { runTestAsRBACReader, runTestAsViewer } from 'test/utils';

import { AppRoutes } from 'routing/types';
import { generateRoutePath } from 'routing/utils';
import { renderEditForm, submitForm } from 'page/__testHelpers__/checkForm';

describe(`<EditCheck />`, () => {
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
    const { container } = await renderEditForm(BASIC_HTTP_CHECK.id);
    expect(container.querySelector('#check-editor-job-input')).toBeDisabled();
  });

  it(`disables the form when the user is a RBAC viewer`, async () => {
    runTestAsRBACReader();
    await renderEditForm(BASIC_HTTP_CHECK.id);
    const submitButton = await screen.findByTestId(DataTestIds.CHECK_FORM_SUBMIT_BUTTON);
    expect(submitButton).toBeDisabled();
  });

  it(`disables the save button when no edits have been made`, async () => {
    await renderEditForm(BASIC_HTTP_CHECK.id);
    expect(await screen.findByTestId(DataTestIds.CHECK_FORM_SUBMIT_BUTTON)).not.toBeEnabled();
  });

  it(`should redirect to the check dashboard when the check is updated`, async () => {
    const { user } = await renderEditForm(BASIC_DNS_CHECK.id);

    const jobNameInput = await screen.findByLabelText('Job name', { exact: false });
    await user.type(jobNameInput, `updated job name`);

    await submitForm(user);

    const pathInfo = await screen.findByTestId(DataTestIds.TEST_ROUTER_INFO_PATHNAME);
    expect(pathInfo).toHaveTextContent(generateRoutePath(AppRoutes.CheckDashboard, { id: BASIC_DNS_CHECK.id! }));
  });
});
