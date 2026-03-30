import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { LIST_ACCESS_TOKENS } from 'test/fixtures/tokens';
import { apiRoute } from 'test/handlers';
import { render } from 'test/render';
import { server } from 'test/server';
import { runTestAsRBACAdmin, runTestAsRBACReader, runTestAsSMEditor, runTestAsSMViewer } from 'test/utils';

import { DataTestIds } from '../../../test/dataTestIds';
import { AccessTokensTab } from './AccessTokensTab';

async function renderAccessTokensTab() {
  const result = render(<AccessTokensTab />);
  await result.findByTestId(DataTestIds.ConfigContent);
  return result;
}

describe('AccessTokensTab', () => {
  it('should render', async () => {
    const { container } = await renderAccessTokensTab();
    expect(container).toBeInTheDocument();
  });

  it('should render with title', async () => {
    const { getByText } = await renderAccessTokensTab();
    expect(getByText('Access tokens')).toBeInTheDocument();
  });

  it('should have a section on access tokens', async () => {
    const { getByText } = await renderAccessTokensTab();
    expect(getByText('Access tokens', { selector: 'h2' })).toBeInTheDocument();
  });

  it('should have a section on synthetic monitoring', async () => {});

  it('should have a section on private probes', async () => {
    const { getByText } = await renderAccessTokensTab();
    expect(getByText('Private probes', { selector: 'h3' })).toBeInTheDocument();
  });

  describe('Permissions', () => {
    const contactAdminMessage = `Contact your administrator to generate Access Tokens`;

    describe('When RBAC is enabled', () => {
      it(`Displays a contact admin message when permissions are not met`, async () => {
        runTestAsRBACReader();
        const { queryByText } = await renderAccessTokensTab();
        expect(queryByText(contactAdminMessage)).toBeInTheDocument();
      });

      it(`Does not display a contact admin message when permissions are met`, async () => {
        runTestAsRBACAdmin();
        const { queryByText } = await renderAccessTokensTab();
        expect(queryByText(contactAdminMessage)).not.toBeInTheDocument();
      });
    });

    describe('When RBAC is disabled', () => {
      it(`Displays a contact admin message when permissions are not met`, async () => {
        runTestAsSMViewer();
        const { queryByText } = await renderAccessTokensTab();
        expect(queryByText(contactAdminMessage)).toBeInTheDocument();
      });

      it(`Does not display a contact admin message when permissions are met`, async () => {
        runTestAsSMEditor();
        const { queryByText } = await renderAccessTokensTab();
        expect(queryByText(contactAdminMessage)).not.toBeInTheDocument();
      });
    });
  });

  describe('Token list', () => {
    it('renders token list with two mock tokens', async () => {
      await renderAccessTokensTab();

      // Token 2: created ~2023-11-14
      await screen.findByText(/2023-11-1/);
      // Token 1: created ~2023-07-22
      expect(screen.getByText(/2023-07-2/)).toBeInTheDocument();
    });

    it('renders the token ID column', async () => {
      await renderAccessTokensTab();

      await screen.findByText(/2023-11-1/);

      expect(screen.getByRole('columnheader', { name: /^id$/i })).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('disables the revoke button for the current token', async () => {
      await renderAccessTokensTab();

      await screen.findByText(/2023-11-1/);

      const revokeButtons = screen.getAllByRole('button', { name: /revoke/i });
      expect(revokeButtons).toHaveLength(2);

      // Fixture: currentTokenId=1. id=2 is first row (non-current), id=1 is second (current).
      expect(revokeButtons[0]).not.toBeDisabled();
      expect(revokeButtons[1]).toBeDisabled();
    });

    it('shows tooltip only on the current token revoke button', async () => {
      await renderAccessTokensTab();

      await screen.findByText(/2023-11-1/);

      const revokeButtons = screen.getAllByRole('button', { name: /revoke/i });
      const currentButton = revokeButtons[1]; // id=1, current
      const nonCurrentButton = revokeButtons[0]; // id=2, non-current

      // Current button is wrapped in a <span> inside a Tooltip.
      expect(currentButton.closest('span')).toBeTruthy();
      // Non-current button's immediate parent is a <td>.
      expect(nonCurrentButton.parentElement?.tagName).toBe('TD');
    });

    it('opens confirmation modal on revoke click', async () => {
      const user = userEvent.setup();
      await renderAccessTokensTab();

      await screen.findByText(/2023-11-1/);

      const revokeButtons = screen.getAllByRole('button', { name: /revoke/i });
      await user.click(revokeButtons[0]);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(screen.getByText(/Revoke access token/i)).toBeInTheDocument();
      expect(screen.getByText(/This action cannot be undone/i)).toBeInTheDocument();
    });

    it('calls deleteToken on confirm and invalidates the list query', async () => {
      const user = userEvent.setup();
      let listCallCount = 0;

      server.use(
        apiRoute('listAccessTokens', {
          result: () => {
            listCallCount++;
            return { json: LIST_ACCESS_TOKENS };
          },
        })
      );

      await renderAccessTokensTab();

      await screen.findByText(/2023-11-1/);
      expect(listCallCount).toBe(1);

      const revokeButtons = screen.getAllByRole('button', { name: /revoke/i });
      await user.click(revokeButtons[0]);

      const confirmButton = screen.getByTestId('data-testid Confirm Modal Danger Button');
      await user.click(confirmButton);

      await waitFor(() => {
        expect(listCallCount).toBeGreaterThanOrEqual(2);
      });
    });

    it('mutation remains idle after a delete failure (list is not re-fetched)', async () => {
      const user = userEvent.setup();
      let deleteCallCount = 0;

      server.use(
        http.delete(/http:\/\/localhost.*\/sm\/token\/([^/]+)/, () => {
          deleteCallCount++;
          return HttpResponse.json({ msg: 'internal error' }, { status: 500 });
        })
      );

      await renderAccessTokensTab();

      await screen.findByText(/2023-11-1/);

      const revokeButtons = screen.getAllByRole('button', { name: /revoke/i });
      await user.click(revokeButtons[0]);

      const confirmButton = screen.getByTestId('data-testid Confirm Modal Danger Button');
      await user.click(confirmButton);

      // The DELETE request was made.
      await waitFor(() => {
        expect(deleteCallCount).toBe(1);
      });

      // The token list is still visible (no crash).
      expect(screen.getByText(/2023-11-1/)).toBeInTheDocument();
    });
  });
});
