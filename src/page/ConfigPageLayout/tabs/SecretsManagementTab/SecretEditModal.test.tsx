import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useSaveSecret, useSecret } from 'data/useSecrets';

import { SECRETS_EDIT_MODE_ADD } from './constants';
import { SecretEditModal } from './SecretEditModal';

// Mock the hooks
jest.mock('data/useSecrets');

const mockUseSecret = useSecret as jest.Mock;
const mockUseSaveSecret = useSaveSecret as jest.Mock;

describe('SecretEditModal', () => {
  const defaultProps = {
    id: SECRETS_EDIT_MODE_ADD,
    onDismiss: jest.fn(),
    open: true,
  };

  const mockSaveMutation = {
    mutate: jest.fn(),
    isPending: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSecret.mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
      error: null,
    });
    mockUseSaveSecret.mockReturnValue(mockSaveMutation);
  });

  it('should not render when open is false', () => {
    render(<SecretEditModal {...defaultProps} open={false} />);
    expect(screen.queryByText('Create secret')).not.toBeInTheDocument();
  });

  it('should render create secret form for new secret', () => {
    render(<SecretEditModal {...defaultProps} />);
    expect(screen.getByText('Create secret')).toBeInTheDocument();
    expect(screen.getByLabelText(/Name \*/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Value/)).toBeInTheDocument();
  });

  it('should render edit secret form for existing secret', async () => {
    const mockSecret = {
      uuid: '123',
      name: 'Test Secret',
      description: 'Test Description',
      labels: [],
    };

    mockUseSecret.mockReturnValue({
      data: mockSecret,
      isLoading: false,
      isError: false,
      error: null,
    });

    render(<SecretEditModal {...defaultProps} id="123" />);

    expect(screen.getByText('Edit secret')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Secret')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Description')).toBeInTheDocument();
  });

  it('should handle adding and removing labels', async () => {
    render(<SecretEditModal {...defaultProps} />);

    const addLabelButton = screen.getByText('Add label');
    await userEvent.click(addLabelButton);

    const nameInput = screen.getByPlaceholderText('name');
    const valueInput = screen.getByPlaceholderText('value');

    await userEvent.type(nameInput, 'label1');
    await userEvent.type(valueInput, 'value1');

    expect(nameInput).toHaveValue('label1');
    expect(valueInput).toHaveValue('value1');

    const removeButton = screen.getByLabelText('Remove label');
    await userEvent.click(removeButton);

    expect(screen.queryByPlaceholderText('name')).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText('value')).not.toBeInTheDocument();
  });

  it('should show error message when secret fetch fails', () => {
    mockUseSecret.mockReturnValue({
      data: null,
      isLoading: false,
      isError: true,
      error: new Error('Failed to fetch secret'),
    });

    render(<SecretEditModal {...defaultProps} id="123" />);

    expect(screen.getByText('Unable to fetch secret')).toBeInTheDocument();
    expect(screen.getByText(/Failed to fetch secret/)).toBeInTheDocument();
  });

  it('should submit form with correct values', async () => {
    render(<SecretEditModal {...defaultProps} />);

    await userEvent.type(screen.getByLabelText(/Name/), 'New Secret');
    await userEvent.type(screen.getByLabelText(/Description/), 'New Description');
    await userEvent.type(screen.getByLabelText(/Value/), 'secret-value');

    const submitButton = screen.getByText('Save');
    await userEvent.click(submitButton);

    expect(mockSaveMutation.mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'new-secret', // transformed to lowercase and hyphenated
        description: 'New Description',
        plaintext: 'secret-value',
        labels: [],
      }),
      expect.any(Object)
    );
  });

  it('should call onDismiss after successful save', async () => {
    mockSaveMutation.mutate.mockImplementation((_, options) => {
      options.onSuccess();
    });

    render(<SecretEditModal {...defaultProps} />);

    await userEvent.type(screen.getByLabelText(/Name/), 'New Secret');
    await userEvent.type(screen.getByLabelText(/Description/), 'My short description');
    await userEvent.type(screen.getByLabelText(/Value/), 'secret-value');

    const submitButton = screen.getByText('Save');
    await userEvent.click(submitButton);

    expect(defaultProps.onDismiss).toHaveBeenCalled();
  });

  it('should show error when save fails', async () => {
    mockSaveMutation.mutate.mockImplementation((_, options) => {
      options.onError(new Error('Failed to save secret'));
    });

    render(<SecretEditModal {...defaultProps} />);

    await userEvent.type(screen.getByLabelText(/Name/), 'New Secret');
    await userEvent.type(screen.getByLabelText(/Description/), 'Short description');
    await userEvent.type(screen.getByLabelText(/Value/), 'secret-value');

    const submitButton = screen.getByText('Save');
    await userEvent.click(submitButton);

    expect(screen.getByText('Unable to save secret')).toBeInTheDocument();
    expect(screen.getByText(/Failed to save secret/)).toBeInTheDocument();
  });
});
