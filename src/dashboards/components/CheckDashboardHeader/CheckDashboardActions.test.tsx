import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { ROUTER_TEST_ID } from 'test/dataTestIds';
import { BASIC_HTTP_CHECK } from 'test/fixtures/checks';
import { apiRoute, getServerRequests } from 'test/handlers';
import { render } from 'test/render';
import { server } from 'test/server';

import { AppRoutes } from 'routing/types';
import { getRoute } from 'routing/utils';

import { CheckDashboardActions } from './CheckDashboardActions';

describe('CheckDashboardActions', () => {
  describe('Pause/Resume check', () => {
    it('renders Pause when the check is enabled', async () => {
      render(<CheckDashboardActions check={{ ...BASIC_HTTP_CHECK, enabled: true }} />);

      expect(await screen.findByRole('button', { name: 'Pause' })).toBeInTheDocument();
    });

    it('renders Resume when the check is disabled', async () => {
      render(<CheckDashboardActions check={{ ...BASIC_HTTP_CHECK, enabled: false }} />);

      expect(await screen.findByRole('button', { name: 'Resume' })).toBeInTheDocument();
    });

    it('sends a request to disable the check when Pause is clicked', async () => {
      const { user } = render(<CheckDashboardActions check={{ ...BASIC_HTTP_CHECK, enabled: true }} />);
      const { read, record } = getServerRequests();
      server.use(apiRoute('updateCheck', {}, record));

      await user.click(await screen.findByRole('button', { name: 'Pause' }));

      const { body } = await read();
      expect(body).toEqual({
        ...BASIC_HTTP_CHECK,
        enabled: false,
      });
    });
  });

  describe('Edit check', () => {
    it('renders the edit check button', async () => {
      render(<CheckDashboardActions check={BASIC_HTTP_CHECK} />);

      expect(await screen.findByRole('link', { name: 'Edit check' })).toBeInTheDocument();
    });
  });

  describe('Delete check', () => {
    it('renders the delete button', async () => {
      render(<CheckDashboardActions check={BASIC_HTTP_CHECK} />);

      expect(await screen.findByRole('button', { name: 'Delete' })).toBeInTheDocument();
    });

    it('opens a confirmation modal when Delete is clicked', async () => {
      const { user } = render(<CheckDashboardActions check={BASIC_HTTP_CHECK} />);

      await user.click(await screen.findByRole('button', { name: 'Delete' }));

      expect(await screen.findByText('Are you sure you want to delete this check?')).toBeInTheDocument();
    });

    it('deletes the check and navigates to the checks list on confirm', async () => {
      const { user } = render(<CheckDashboardActions check={BASIC_HTTP_CHECK} />);
      const { read, record } = getServerRequests();
      server.use(apiRoute('deleteCheck', {}, record));

      await user.click(await screen.findByRole('button', { name: 'Delete' }));
      await user.click(await screen.findByRole('button', { name: 'Delete check' }));

      await read();
      await waitFor(() => {
        expect(screen.getByTestId(ROUTER_TEST_ID.pathname)).toHaveTextContent(getRoute(AppRoutes.Checks));
      });
    });
  });
});
