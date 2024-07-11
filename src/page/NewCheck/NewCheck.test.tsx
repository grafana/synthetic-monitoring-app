import { screen } from '@testing-library/react';
import { apiRoute } from 'test/handlers';
import { server } from 'test/server';

import { CheckType } from 'types';
import { fillMandatoryFields } from 'page/__testHelpers__/apiEndPoint';
import { renderNewForm, submitForm } from 'page/__testHelpers__/checkForm';

describe(`<NewCheck />`, () => {
  it(`should show an error message when it fails to save a check`, async () => {
    const { user } = await renderNewForm(CheckType.HTTP);
    server.use(
      apiRoute(`addCheck`, {
        result: () => {
          return {
            status: 500,
          };
        },
      })
    );

    await fillMandatoryFields({ user, checkType: CheckType.HTTP });
    await submitForm(user);

    expect(screen.getByText(/Save failed/)).toBeInTheDocument();
  });

  // jsdom doesn't give us back the submitter of the form, so we can't test this
  // https://github.com/jsdom/jsdom/issues/3117
  it.skip(`should show an error message when it fails to test a check`, async () => {});
});
