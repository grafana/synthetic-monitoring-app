import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import {
  BASIC_CHECK_LIST,
  BASIC_DNS_CHECK,
  BASIC_HTTP_CHECK,
  BASIC_MULTIHTTP_CHECK,
  BASIC_PING_CHECK,
  BASIC_TCP_CHECK,
  BASIC_TRACEROUTE_CHECK,
} from 'test/fixtures/checks';
import { render } from 'test/render';

import { ROUTES } from 'types';
import { checkType } from 'utils';
import { PLUGIN_URL_PATH } from 'components/constants';

import { CheckForm } from './CheckForm';

describe(`<CheckForm />`, () => {
  describe(`saving a check`, () => {
    BASIC_CHECK_LIST.map((check) => {
      const type = checkType(check.settings);

      it(`triggers form validation when trying to save a ${type} check`, async () => {
        const { user } = render(<CheckForm />, {
          route: `${PLUGIN_URL_PATH}${ROUTES.Checks}/new/:checkType`,
          path: `${PLUGIN_URL_PATH}${ROUTES.Checks}/new/${type}`,
        });

        const testButton = await screen.findByRole('button', { name: 'Save' });
        await waitFor(() => expect(testButton).toBeInTheDocument());
        await user.click(testButton);
        expect(screen.getByText(`Job name is required`)).toBeInTheDocument();
      });
    });
  });

  describe(`adhoc tests`, () => {
    [BASIC_DNS_CHECK, BASIC_HTTP_CHECK, BASIC_MULTIHTTP_CHECK, BASIC_PING_CHECK, BASIC_TCP_CHECK].forEach((check) => {
      const type = checkType(check.settings);

      it(`triggers form validation when trying to test a ${type} check`, async () => {
        const { user } = render(<CheckForm />, {
          route: `${PLUGIN_URL_PATH}${ROUTES.Checks}/new/:checkType`,
          path: `${PLUGIN_URL_PATH}${ROUTES.Checks}/new/${type}`,
        });

        const testButton = await screen.findByRole('button', { name: 'Test' });
        await waitFor(() => expect(testButton).toBeInTheDocument());
        await user.click(testButton);
        expect(screen.getByText(`Job name is required`)).toBeInTheDocument();
      });
    });

    [BASIC_MULTIHTTP_CHECK, BASIC_TRACEROUTE_CHECK].forEach((check) => {
      const type = checkType(check.settings);

      it(`doesn't show the test button for a ${type} check`, async () => {
        render(<CheckForm />, {
          route: `${PLUGIN_URL_PATH}${ROUTES.Checks}/new/:checkType`,
          path: `${PLUGIN_URL_PATH}${ROUTES.Checks}/new/${type}`,
        });

        const testButton = screen.queryByRole('button', { name: 'Test' });
        expect(testButton).not.toBeInTheDocument();
      });
    });
  });
});
