import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useDeleteSecret, useSecrets } from 'data/useSecrets';

import { MOCKED_SECRETS } from '../../../../test/fixtures/secrets';
import { SECRETS_EDIT_MODE_ADD } from './constants';
import { SecretsManagementTab } from './SecretsManagementTab';
import { SecretsManagementUI } from './SecretsManagementUI';

jest.mock('./SecretEditModal', () => ({
  SecretEditModal: ({ onDismiss, open, id }: { onDismiss?: () => void; id: string; open?: boolean }) => {
    if (!open) {
      return null;
    }

    return (
      <div role="dialog" aria-label="Create secret">
        <span data-testid="modal-id">{id}</span>
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
      render(<SecretsManagementUI />);

      expect(screen.getByText(/you don't have any secrets yet/i)).toBeInTheDocument();
    });

    it('should have create button', async () => {
      render(<SecretsManagementUI />);
      const addButton = screen.getByRole('button', { name: /create secret/i });
      await userEvent.click(addButton);

      expect(screen.getByRole('dialog', { name: /create secret/i })).toBeInTheDocument();
      expect(screen.getByTestId('modal-id')).toHaveTextContent(SECRETS_EDIT_MODE_ADD);
    });
  });

  it('should display loading state', async () => {
    (useSecrets as jest.Mock).mockReturnValue({ isLoading: true });
    render(<SecretsManagementTab />);
    expect(screen.getByLabelText('Loading secrets')).toBeInTheDocument();
  });

  it.each(MOCKED_SECRETS.map((secret) => [secret.name, secret.uuid, secret.description]))(
    'should render %s (%s) (incl description)',
    async (name, uuid) => {
      render(<SecretsManagementTab />);
      await waitFor(() => {
        expect(screen.getByText(name)).toBeInTheDocument();
        expect(screen.getByText(uuid)).toBeInTheDocument();
      });
    }
  );

  it('should open edit secret modal', async () => {
    render(<SecretsManagementTab />);
    const editButton = screen.getAllByRole('button', { name: /edit/i })[0];
    await userEvent.click(editButton);
    expect(screen.getByTestId('modal-id')).toHaveTextContent(MOCKED_SECRETS[0].uuid);
  });

  it('should open delete secret modal', async () => {
    render(<SecretsManagementTab />);
    const deleteButton = screen.getAllByRole('button', { name: /delete/i })[0];
    await userEvent.click(deleteButton);
    expect(screen.getByTestId('data-testid Confirm Modal Danger Button')).toBeInTheDocument();
  });

  it('should require "delete" input text to delete', async () => {
    render(<SecretsManagementTab />);
    const deleteButton = screen.getAllByRole('button', { name: /delete/i })[0];
    await userEvent.click(deleteButton);
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
