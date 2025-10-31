import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MOCKED_SECRETS } from 'test/fixtures/secrets';

import { formatDate } from 'utils';

import { SecretCard } from './SecretCard';

const writeText = jest.fn();

Object.assign(navigator, {
  clipboard: {
    writeText,
  },
});

// This is required for the copy to clipboard functionality to work in tests
Object.defineProperty(window, 'isSecureContext', {
  value: true,
});

describe('SecretCard', () => {
  const defaultProps = {
    secret: MOCKED_SECRETS[0],
    onEdit: jest.fn(),
    onDelete: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render secret details correctly', () => {
    render(<SecretCard {...defaultProps} />);

    // Check basic information
    expect(screen.getByText(MOCKED_SECRETS[0].name)).toBeInTheDocument();
    expect(screen.getByText(MOCKED_SECRETS[0].description)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`${MOCKED_SECRETS[0].created_by}`))).toBeInTheDocument();

    // Check labels
    MOCKED_SECRETS[0].labels.forEach((label) => {
      expect(screen.getByText(`${label.name}: ${label.value}`)).toBeInTheDocument();
    });
  });

  it('should call onEdit when edit button is clicked', async () => {
    render(<SecretCard {...defaultProps} />);

    const editButton = screen.getByRole('button', { name: `Edit ${MOCKED_SECRETS[0].name}` });
    const user = userEvent.setup();
    await user.click(editButton);

    expect(defaultProps.onEdit).toHaveBeenCalledWith(MOCKED_SECRETS[0].name);
  });

  it('should call onDelete when delete button is clicked', async () => {
    render(<SecretCard {...defaultProps} />);

    const deleteButton = screen.getByRole('button', { name: `Delete ${MOCKED_SECRETS[0].name}` });
    const user = userEvent.setup();
    await user.click(deleteButton);

    expect(defaultProps.onDelete).toHaveBeenCalledWith(MOCKED_SECRETS[0].name);
  });

  it('should render without labels when none are provided', () => {
    const secretWithoutLabels = {
      ...MOCKED_SECRETS[0],
      labels: [],
    };

    render(<SecretCard {...defaultProps} secret={secretWithoutLabels} />);

    expect(screen.queryByText('env: prod')).not.toBeInTheDocument();
    expect(screen.queryByText('type: api-key')).not.toBeInTheDocument();
  });

  it('should format the creation date correctly', () => {
    render(<SecretCard {...defaultProps} />);

    expect(screen.getByText(formatDate(MOCKED_SECRETS[0].created_at), { exact: false })).toBeInTheDocument();
  });

  it('should handle secrets without description', () => {
    const secretWithoutDescription = {
      ...MOCKED_SECRETS[0],
      description: '',
    };

    render(<SecretCard {...defaultProps} secret={secretWithoutDescription} />);

    // The description field should still be rendered but empty
    const descriptionLabel = screen.getByText('Description:');
    expect(descriptionLabel).toBeInTheDocument();
  });

  it('should handle secrets without created_by information', () => {
    const secretWithoutCreator = {
      ...MOCKED_SECRETS[0],
      created_by: '',
    };

    render(<SecretCard {...defaultProps} secret={secretWithoutCreator} />);

    expect(screen.getByText('Created:')).toBeInTheDocument();
    expect(screen.getByText(formatDate(secretWithoutCreator.created_at), { exact: false })).toBeInTheDocument();
  });
});
