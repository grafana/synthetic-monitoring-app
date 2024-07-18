import React from 'react';
import { waitFor } from '@testing-library/react';
import { render } from 'test/render';

import { CheckType, CheckTypeGroup, ROUTES } from 'types';
import { PLUGIN_URL_PATH } from 'components/Routing.consts';

import { CheckRouter } from './CheckRouter';

describe(`<CheckRouter />`, () => {
  it(`should redirect from the old add new check route to the new one`, async () => {
    const checkType = CheckType.HTTP;

    const { history } = render(<CheckRouter />, {
      path: `${PLUGIN_URL_PATH}${ROUTES.Checks}/new/${checkType}`,
      route: `${PLUGIN_URL_PATH}${ROUTES.Checks}`,
    });

    await waitFor(() =>
      expect(history.location.pathname).toBe(`${PLUGIN_URL_PATH}${ROUTES.Checks}/new/${CheckTypeGroup.ApiTest}`)
    );
    expect(history.location.search).toBe(`?checkType=${checkType}`);
  });

  it(`should redirect from the old edit check route to the new one`, async () => {
    const checkType = CheckType.HTTP;
    const checkID = 1;

    const { history } = render(<CheckRouter />, {
      path: `${PLUGIN_URL_PATH}${ROUTES.Checks}/edit/${checkType}/${checkID}`,
      route: `${PLUGIN_URL_PATH}${ROUTES.Checks}`,
    });

    await waitFor(() =>
      expect(history.location.pathname).toBe(
        `${PLUGIN_URL_PATH}${ROUTES.Checks}/edit/${CheckTypeGroup.ApiTest}/${checkID}`
      )
    );
  });
});
