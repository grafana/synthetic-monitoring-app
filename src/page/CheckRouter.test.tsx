import React from 'react';
import { OrgRole } from '@grafana/data';
import { config } from '@grafana/runtime';
import { screen, waitFor } from '@testing-library/react';
import { BASIC_HTTP_CHECK, BASIC_SCRIPTED_CHECK } from 'test/fixtures/checks';
import { render } from 'test/render';

import { CheckType, CheckTypeGroup, ROUTES } from 'types';
import { PLUGIN_URL_PATH } from 'components/Routing.consts';

import { CheckRouter } from './CheckRouter';
import { runTestAsViewer } from 'test/utils';

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
    expect(screen.getByText(`New API Endpoint check`)).toBeInTheDocument();
  });

  it(`should redirect from the old edit check route to the new one`, async () => {
    const checkType = CheckType.HTTP;
    const checkID = BASIC_HTTP_CHECK.id;

    const { history } = render(<CheckRouter />, {
      path: `${PLUGIN_URL_PATH}${ROUTES.Checks}/edit/${checkType}/${checkID}`,
      route: `${PLUGIN_URL_PATH}${ROUTES.Checks}`,
    });

    await waitFor(() =>
      expect(history.location.pathname).toBe(
        `${PLUGIN_URL_PATH}${ROUTES.Checks}/edit/${CheckTypeGroup.ApiTest}/${checkID}`
      )
    );
    const title = await screen.findByText(`Editing ${BASIC_HTTP_CHECK.job}`);
    expect(title).toBeInTheDocument();
  });

  it(`renders the new scripted check page`, async () => {
    const checkType = CheckType.Scripted;

    render(<CheckRouter />, {
      path: `${PLUGIN_URL_PATH}${ROUTES.Checks}/new/${checkType}`,
      route: `${PLUGIN_URL_PATH}${ROUTES.Checks}`,
    });

    const title = await screen.findByText(`New Scripted check`);
    expect(title).toBeInTheDocument();
  });

  it(`renders the edit scripted check page`, async () => {
    const checkType = CheckType.Scripted;
    const checkID = BASIC_SCRIPTED_CHECK.id;

    render(<CheckRouter />, {
      path: `${PLUGIN_URL_PATH}${ROUTES.Checks}/edit/${checkType}/${checkID}`,
      route: `${PLUGIN_URL_PATH}${ROUTES.Checks}`,
    });

    const title = await screen.findByText(`Editing ${BASIC_SCRIPTED_CHECK.job}`);
    expect(title).toBeInTheDocument();
  });

  describe('Permissions', () => {
    describe('When user is viewer', () => {
      beforeEach(() => {
        runTestAsViewer();
      });
      it(`Should not load the edit check route and redirect to the homepage`, async () => {
        const checkType = CheckType.Scripted;
        const checkID = BASIC_SCRIPTED_CHECK.id;

        const { history } = render(<CheckRouter />, {
          path: `${PLUGIN_URL_PATH}${ROUTES.Checks}/edit/${checkType}/${checkID}`,
          route: `${PLUGIN_URL_PATH}${ROUTES.Checks}`,
        });

        await waitFor(() => expect(history.location.pathname).toBe(`${PLUGIN_URL_PATH}${ROUTES.Checks}`));
      });
    });

    describe('When user is editor', () => {
      it(`Should load the edit check route`, async () => {
        const checkType = CheckType.Scripted;
        const checkID = BASIC_SCRIPTED_CHECK.id;

        render(<CheckRouter />, {
          path: `${PLUGIN_URL_PATH}${ROUTES.Checks}/edit/${checkType}/${checkID}`,
          route: `${PLUGIN_URL_PATH}${ROUTES.Checks}`,
        });

        const title = await screen.findByText(`Editing ${BASIC_SCRIPTED_CHECK.job}`);
        expect(title).toBeInTheDocument();
      });
    });
  });
});
