import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SecretWithMetadata } from './types';
import { formatDate } from 'utils';

import { SecretCard } from './SecretCard';

// Mock the formatDate utility
jest.mock('utils', () => ({
  formatDate: jest.fn((date) => date.toString()),
}));

const writeText = jest.fn();

Object.assign(navigator, {
  clipboard: {
    writeText,
  },
});

Object.defineProperty(window, 'isSecureContext', {
  value: true,
});

describe('SecretCard', () => {
  const mockSecret: SecretWithMetadata = {
    uuid: 'secret-123',
    name: 'Test Secret',
    description: 'Test Description',
    created_at: Number(new Date('2024-01-01')),
    created_by: 'test-user',
    labels: [
      { name: 'env', value: 'prod' },
      { name: 'type', value: 'api-key' },
    ],
    modified_at: Number(new Date('2024-01-02')),
    org_id: 1,
    stack_id: 1,
  };

  const defaultProps = {
    secret: mockSecret,
    onEdit: jest.fn(),
    onDelete: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render secret details correctly', () => {
    render(<SecretCard {...defaultProps} />);

    // Check basic information
    expect(screen.getByText('Test Secret')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
    expect(screen.getByText('secret-123')).toBeInTheDocument();
    expect(screen.getByText(/test-user/)).toBeInTheDocument();

    // Check labels
    expect(screen.getByText('env: prod')).toBeInTheDocument();
    expect(screen.getByText('type: api-key')).toBeInTheDocument();
  });

  it('should call onEdit when edit button is clicked', () => {
    render(<SecretCard {...defaultProps} />);

    const editButton = screen.getByRole('button', { name: 'Edit Test Secret' });
    fireEvent.click(editButton);

    expect(defaultProps.onEdit).toHaveBeenCalledWith('secret-123');
  });

  it('should call onDelete when delete button is clicked', () => {
    render(<SecretCard {...defaultProps} />);

    const deleteButton = screen.getByRole('button', { name: 'Delete Test Secret' });
    fireEvent.click(deleteButton);

    expect(defaultProps.onDelete).toHaveBeenCalledWith('secret-123');
  });

  it('should render without labels when none are provided', () => {
    const secretWithoutLabels = {
      ...mockSecret,
      labels: [],
    };

    render(<SecretCard {...defaultProps} secret={secretWithoutLabels} />);

    expect(screen.queryByText('env: prod')).not.toBeInTheDocument();
    expect(screen.queryByText('type: api-key')).not.toBeInTheDocument();
  });

  it('should format the creation date correctly', () => {
    render(<SecretCard {...defaultProps} />);

    expect(formatDate).toHaveBeenCalledWith(mockSecret.created_at);
  });

  it('should render a clipboard button for the secret UUID', () => {
    render(<SecretCard {...defaultProps} />);

    const clipboardButton = screen.getByRole('button', { name: /copy/i });
    expect(clipboardButton).toBeInTheDocument();
  });

  // Test for clipboard functionality
  it('should provide correct text for clipboard copy', async () => {
    const user = userEvent.setup();
    render(<SecretCard {...defaultProps} />);

    // Find the clipboard component
    const clipboardButton = screen.getByRole('button', { name: /Copy Test Secret ID/i });
    await act(() => {
      return user.click(clipboardButton);
    });
    // Instead of accessing props directly, test the actual copy behavior

    const clipboardText = await navigator.clipboard.readText();
    // Verify the copy behavior through the clipboard API
    // You might need to mock navigator.clipboard
    expect(clipboardText).toBe('secret-123');
  });

  it('should handle secrets without description', () => {
    const secretWithoutDescription = {
      ...mockSecret,
      description: '',
    };

    render(<SecretCard {...defaultProps} secret={secretWithoutDescription} />);

    // The description field should still be rendered but empty
    const descriptionLabel = screen.getByText('Description:');
    expect(descriptionLabel).toBeInTheDocument();
  });

  it('should handle secrets without created_by information', () => {
    const secretWithoutCreator = {
      ...mockSecret,
      created_by: '',
    };

    render(<SecretCard {...defaultProps} secret={secretWithoutCreator} />);

    expect(screen.getByText('Created:')).toBeInTheDocument();
    expect(formatDate).toHaveBeenCalledWith(mockSecret.created_at);
  });
});
