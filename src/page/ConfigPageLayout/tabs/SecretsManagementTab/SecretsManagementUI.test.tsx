import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  runTestAsSecretsCreator,
  runTestAsSecretsEditor,
  runTestAsSecretsFullAccess,
  runTestAsSecretsReadOnly,
} from 'test/utils';

import { useDeleteSecret, useSecrets } from 'data/useSecrets';

import { MOCKED_SECRETS } from '../../../../test/fixtures/secrets';
import { SECRETS_EDIT_MODE_ADD } from './constants';
import { SecretsManagementTab } from './SecretsManagementTab';
import { SecretsManagementUI } from './SecretsManagementUI';

jest.mock('./SecretEditModal', () => ({
  SecretEditModal: ({ onDismiss, open, name }: { onDismiss?: () => void; name: string; open?: boolean }) => {
    if (!open) {
      return null;
    }

    return (
      <div role="dialog" aria-label="Create secret">
        <span data-testid="modal-id">{name}</span>
        <button onClick={onDismiss}>Close</button>
      </div>
    );
  },
}));

jest.mock('data/useSecrets', () => ({
  useSecrets: jest.fn(),
  useSecret: jest.fn(),
  useDeleteSecret: jest.fn(),
  useSaveSecret: jest.fn(),
}));

describe('SecretsManagementUI', () => {
  const mockDeleteMutation = {
    mutate: jest.fn(),
    isLoading: false,
    isError: false,
    error: null,
  };

  beforeEach(() => {
    (useSecrets as jest.Mock).mockReturnValue({
      data: MOCKED_SECRETS,
      isLoading: false,
      isError: false,
      error: null,
    });

    (useDeleteSecret as jest.Mock).mockReturnValue(mockDeleteMutation);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Empty state', () => {
    beforeEach(() => {
      (useSecrets as jest.Mock).mockReturnValue({ data: [], isLoading: false });
    });
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should render empty state when no secrets exist', async () => {
      runTestAsSecretsFullAccess();
      render(<SecretsManagementUI />);

      expect(screen.getByText(/you don't have any secrets yet/i)).toBeInTheDocument();
    });

    it('should have create button for users with create permissions', async () => {
      runTestAsSecretsFullAccess();
      render(<SecretsManagementUI />);

      const addButton = screen.getByRole('button', { name: /create secret/i });
      await userEvent.click(addButton);

      expect(screen.getByRole('dialog', { name: /create secret/i })).toBeInTheDocument();
      expect(screen.getByTestId('modal-id')).toHaveTextContent(SECRETS_EDIT_MODE_ADD);
    });

    it('should have create button for users with creator permissions', async () => {
      runTestAsSecretsCreator();
      render(<SecretsManagementUI />);

      expect(screen.getByRole('button', { name: /create secret/i })).toBeInTheDocument();
    });

    it('should not have create button for read-only users', async () => {
      runTestAsSecretsReadOnly();
      render(<SecretsManagementUI />);

      expect(screen.queryByRole('button', { name: /create secret/i })).not.toBeInTheDocument();
      expect(screen.getByText(/Contact an admin to create secrets/)).toBeInTheDocument();
    });

    it('should not have create button for editor-only users', async () => {
      runTestAsSecretsEditor();
      render(<SecretsManagementUI />);

      expect(screen.queryByRole('button', { name: /create secret/i })).not.toBeInTheDocument();
      expect(screen.getByText(/Contact an admin to create secrets/)).toBeInTheDocument();
    });
  });

  describe('Secrets list with permission-based actions', () => {
    it('should display loading state', async () => {
      (useSecrets as jest.Mock).mockReturnValue({ isLoading: true });
      render(<SecretsManagementTab />);
      expect(screen.getByLabelText('Loading secrets')).toBeInTheDocument();
    });

    it.each(MOCKED_SECRETS.map((secret) => [secret.name, secret.uuid, secret.description]))(
      'should render %s (%s) (incl description)',
      async (name, uuid) => {
        runTestAsSecretsFullAccess();
        render(<SecretsManagementTab />);
        await waitFor(() => {
          expect(screen.getByText(name)).toBeInTheDocument();
          expect(screen.getByText(uuid)).toBeInTheDocument();
        });
      }
    );

    it('should show both edit and delete buttons for users with full access', async () => {
      runTestAsSecretsFullAccess();
      render(<SecretsManagementTab />);

      await waitFor(() => {
        expect(screen.getAllByRole('button', { name: /edit/i })).toHaveLength(MOCKED_SECRETS.length);
        expect(screen.getAllByRole('button', { name: /delete/i })).toHaveLength(MOCKED_SECRETS.length);
      });
    });

    it('should show no action buttons for read-only users', async () => {
      runTestAsSecretsReadOnly();
      render(<SecretsManagementTab />);

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
      });
    });

    it('should show only edit buttons for users with update permissions', async () => {
      runTestAsSecretsEditor();
      render(<SecretsManagementTab />);

      await waitFor(() => {
        expect(screen.getAllByRole('button', { name: /edit/i })).toHaveLength(MOCKED_SECRETS.length);
        expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
      });
    });

    it('should show main create button for users with create permissions when secrets exist', async () => {
      runTestAsSecretsFullAccess();
      render(<SecretsManagementTab />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create secret/i })).toBeInTheDocument();
      });
    });

    it('should not show main create button for read-only users when secrets exist', async () => {
      runTestAsSecretsReadOnly();
      render(<SecretsManagementTab />);

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /create secret/i })).not.toBeInTheDocument();
      });
    });

    it('should open edit secret modal when user has update permissions', async () => {
      runTestAsSecretsEditor();
      render(<SecretsManagementTab />);

      await waitFor(() => {
        expect(screen.getAllByRole('button', { name: /edit/i })).toHaveLength(MOCKED_SECRETS.length);
      });

      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      await userEvent.click(editButtons[0]);

      expect(screen.getByTestId('modal-id')).toHaveTextContent(MOCKED_SECRETS[0].name);
    });

    it('should open delete secret modal when user has delete permissions', async () => {
      runTestAsSecretsFullAccess();
      render(<SecretsManagementTab />);

      await waitFor(() => {
        expect(screen.getAllByRole('button', { name: /delete/i })).toHaveLength(MOCKED_SECRETS.length);
      });

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await userEvent.click(deleteButtons[0]);

      expect(screen.getByTestId('data-testid Confirm Modal Danger Button')).toBeInTheDocument();
    });

    it('should require "delete" input text to delete when user has delete permissions', async () => {
      runTestAsSecretsFullAccess();
      render(<SecretsManagementTab />);

      await waitFor(() => {
        expect(screen.getAllByRole('button', { name: /delete/i })).toHaveLength(MOCKED_SECRETS.length);
      });

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await userEvent.click(deleteButtons[0]);

      const confirmButton = screen.getByTestId('data-testid Confirm Modal Danger Button');
      await userEvent.click(confirmButton);
      expect(mockDeleteMutation.mutate).toHaveBeenCalledTimes(0);

      const inputWrapper = screen.getByTestId('input-wrapper');
      const input = within(inputWrapper).getByPlaceholderText(/type "delete" to confirm/i);
      await userEvent.type(input, 'wrong text');
      await userEvent.click(confirmButton);
      expect(mockDeleteMutation.mutate).toHaveBeenCalledTimes(0);
      await userEvent.clear(input); // reset input
      await userEvent.type(input, 'delete');
      await userEvent.click(confirmButton);
      expect(mockDeleteMutation.mutate).toHaveBeenCalledTimes(1);
    });
  });
});
