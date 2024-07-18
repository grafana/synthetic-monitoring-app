import { screen } from '@testing-library/react';
import { BASIC_HTTP_CHECK } from 'test/fixtures/checks';
import { apiRoute } from 'test/handlers';
import { server } from 'test/server';
import { runTestAsViewer } from 'test/utils';

import { renderEditForm } from 'page/__testHelpers__/checkForm';

describe(`<EditCheck />`, () => {
  it(`renders the can't find check modal when given a bad check id`, async () => {
    await renderEditForm({ id: -1, settings: { scripted: { script: `` } } });
    expect(screen.getByText(/We were unable to find your check/)).toBeInTheDocument();
  });

  it(`renders the can't find check modal when given a bad check id`, async () => {
    await renderEditForm({ id: -1, settings: { scripted: { script: `` } } });
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

    await renderEditForm(BASIC_HTTP_CHECK);
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

    await renderEditForm(BASIC_HTTP_CHECK);
    expect(screen.queryByText(/Check limit reached/)).not.toBeInTheDocument();
  });

  it(`disables the form when the user is a viewer`, async () => {
    runTestAsViewer();
    await renderEditForm(BASIC_HTTP_CHECK);
    expect(screen.getByRole(`button`, { name: `Submit` })).toBeDisabled();
  });
});
