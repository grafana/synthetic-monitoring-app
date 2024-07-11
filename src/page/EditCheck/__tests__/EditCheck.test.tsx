import { screen } from '@testing-library/react';
import { BASIC_HTTP_CHECK } from 'test/fixtures/checks';
import { apiRoute } from 'test/handlers';
import { server } from 'test/server';

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
});
