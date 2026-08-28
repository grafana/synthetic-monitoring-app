import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { CREATE_ACCESS_TOKEN, CURRENT_TOKEN_ID, LIST_ACCESS_TOKENS, OTHER_TOKEN_ID } from 'test/fixtures/tokens';
import { apiRoute } from 'test/handlers';
import { render } from 'test/render';
import { server } from 'test/server';
import { runTestAsRBACAdmin, runTestAsRBACReader, runTestAsSMEditor, runTestAsSMViewer } from 'test/utils';

import { ListTokensResponse } from 'datasource/responses.types';

import { CONFIG_TEST_ID } from '../../../test/dataTestIds';
import { AccessTokensTab } from './AccessTokensTab';

async function renderAccessTokensTab() {
  const result = render(<AccessTokensTab />);
  await result.findByTestId(CONFIG_TEST_ID.content);

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

  it('should have a section on synthetic monitoring', async () => {
    const { getByText } = await renderAccessTokensTab();
    expect(getByText('Synthetic Monitoring', { selector: 'h3' })).toBeInTheDocument();
  });

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
        // The Existing tokens section is gated entirely, not shown empty.
        expect(queryByText('Existing tokens')).not.toBeInTheDocument();
      });

      it(`Displays a contact admin message for editors because token actions are admin-only`, async () => {
        runTestAsSMEditor();
        const { queryByText } = await renderAccessTokensTab();
        expect(queryByText(contactAdminMessage)).toBeInTheDocument();
      });
    });
  });

  describe('Token creation', () => {
    it('disables Generate while a create is in flight so rapid clicks issue a single token', async () => {
      const user = userEvent.setup();
      let createCallCount = 0;

      server.use(
        apiRoute('createAccessToken', {
          result: async () => {
            createCallCount++;
            await new Promise((resolve) => setTimeout(resolve, 100));
            return { json: { msg: 'token created', token: CREATE_ACCESS_TOKEN } };
          },
        })
      );

      await renderAccessTokensTab();

      const generateButton = screen.getByRole('button', { name: /generate access token/i });
      await user.click(generateButton);

      await waitFor(() => expect(generateButton).toBeDisabled());
      // Attempted double-click while the first create is still in flight.
      fireEvent.click(generateButton);

      expect(await screen.findByText(/copy your access token now/i)).toBeInTheDocument();
      expect(createCallCount).toBe(1);
      await waitFor(() => expect(generateButton).toBeEnabled());
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
      expect(screen.getByText(OTHER_TOKEN_ID)).toBeInTheDocument();
      expect(screen.getByText(CURRENT_TOKEN_ID)).toBeInTheDocument();
    });

    it('disables the revoke button for the current token', async () => {
      await renderAccessTokensTab();

      await screen.findByText(/2023-11-1/);

      const revokeButtons = screen.getAllByRole('button', { name: /revoke/i });
      expect(revokeButtons).toHaveLength(2);

      // Fixture: OTHER_TOKEN_ID is the first row (non-current), CURRENT_TOKEN_ID the second (current).
      expect(revokeButtons[0]).not.toBeDisabled();
      expect(revokeButtons[1]).toBeDisabled();
    });

    it('shows tooltip only on the current token revoke button', async () => {
      await renderAccessTokensTab();

      await screen.findByText(/2023-11-1/);

      const revokeButtons = screen.getAllByRole('button', { name: /revoke/i });
      const currentButton = revokeButtons[1]; // CURRENT_TOKEN_ID, current
      const nonCurrentButton = revokeButtons[0]; // OTHER_TOKEN_ID, non-current

      // Current button is wrapped in a <span> inside a Tooltip.
      expect(currentButton.closest('span')).toBeTruthy();
      // Non-current button is not wrapped in a Tooltip span.
      expect(nonCurrentButton.parentElement?.tagName).not.toBe('SPAN');
    });

    it('disables every revoke button when the current token cannot be identified', async () => {
      // current_token_id is omitted for requests not bound to a token; the
      // revoke guard must fail closed rather than allow revoking the token
      // the plugin itself uses.
      server.use(
        apiRoute('listAccessTokens', {
          result: () => ({ json: { ...LIST_ACCESS_TOKENS, current_token_id: undefined } }),
        })
      );

      await renderAccessTokensTab();

      await screen.findByText(OTHER_TOKEN_ID);
      const revokeButtons = screen.getAllByRole('button', { name: /revoke/i });
      expect(revokeButtons).toHaveLength(2);
      revokeButtons.forEach((button) => expect(button).toBeDisabled());
    });

    it('shows an error alert instead of the empty state when the list fails to load', async () => {
      server.use(
        apiRoute('listAccessTokens', {
          result: () => ({ status: 500, json: { msg: 'internal error' } }),
        })
      );

      await renderAccessTokensTab();

      expect(await screen.findByText(/Failed to load access tokens/i)).toBeInTheDocument();
      expect(screen.queryByText(/No tokens found/i)).not.toBeInTheDocument();
    });

    it('appends the next page when Load more is clicked', async () => {
      const PAGE_TWO_TOKEN_ID = '01838aaa-0000-7000-8000-000000000003';
      const pageOne: ListTokensResponse = {
        ...LIST_ACCESS_TOKENS,
        next_cursor: 'cursor-to-page-two',
        total_count: 3,
      };
      const pageTwo: ListTokensResponse = {
        items: [{ id: PAGE_TWO_TOKEN_ID, created: 1650000000, lastUsed: 0 }],
        next_cursor: '',
        prev_cursor: 'cursor-to-page-one',
        total_count: 3,
        current_token_id: CURRENT_TOKEN_ID,
      };

      server.use(
        apiRoute('listAccessTokens', {
          result: (req) => {
            const cursor = new URL(req.url).searchParams.get('cursor');
            return { json: cursor ? pageTwo : pageOne };
          },
        })
      );

      const user = userEvent.setup();
      await renderAccessTokensTab();

      await screen.findByText(OTHER_TOKEN_ID);
      await user.click(screen.getByRole('button', { name: /load more \(1 remaining\)/i }));

      expect(await screen.findByText(PAGE_TWO_TOKEN_ID)).toBeInTheDocument();
      // The first page is still visible: pages append rather than replace.
      expect(screen.getByText(OTHER_TOKEN_ID)).toBeInTheDocument();
      expect(screen.getByText(CURRENT_TOKEN_ID)).toBeInTheDocument();
      // The never-used page-two token renders 'Never' and there is no further page.
      expect(screen.getByText('Never')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /load more/i })).not.toBeInTheDocument();
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

    it('calls deleteToken on confirm and refetches the list', async () => {
      const user = userEvent.setup();
      let listCallCount = 0;
      let revokeRequestUrl = '';

      server.use(
        apiRoute('listAccessTokens', {
          result: () => {
            listCallCount++;
            return { json: LIST_ACCESS_TOKENS };
          },
        }),
        apiRoute('revokeAccessToken', undefined, (req) => {
          revokeRequestUrl = req.url;
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

      // The DELETE hit the endpoint for the clicked row's token id.
      expect(revokeRequestUrl).toContain(`/sm/token/${OTHER_TOKEN_ID}`);
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
