import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { SecretInput } from './SecretInput';

describe('SecretInput', () => {
  const defaultProps = {
    isConfigured: false,
    onReset: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render textarea when not configured', () => {
    render(<SecretInput {...defaultProps} />);

    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveAttribute('id', 'secret-value');
    expect(textarea).toHaveAttribute('rows', '5');
    expect(textarea).not.toBeDisabled();
  });

  it('should render disabled input with "configured" text when configured', () => {
    render(<SecretInput {...defaultProps} isConfigured={true} />);

    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
    expect(input).toBeDisabled();
    expect(input).toHaveValue('configured');
  });

  it('should render reset button when configured', () => {
    render(<SecretInput {...defaultProps} isConfigured={true} />);

    const resetButton = screen.getByRole('button', { name: 'Reset' });
    expect(resetButton).toBeInTheDocument();
  });

  it('should call onReset when reset button is clicked', () => {
    render(<SecretInput {...defaultProps} isConfigured={true} />);

    const resetButton = screen.getByRole('button', { name: 'Reset' });
    fireEvent.click(resetButton);

    expect(defaultProps.onReset).toHaveBeenCalledTimes(1);
  });

  it('should not render reset button when not configured', () => {
    render(<SecretInput {...defaultProps} />);

    const resetButton = screen.queryByRole('button', { name: 'Reset' });
    expect(resetButton).not.toBeInTheDocument();
  });

  it('should pass through additional TextArea props when not configured', () => {
    const placeholder = 'Enter secret value';
    render(<SecretInput {...defaultProps} placeholder={placeholder} />);

    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('placeholder', placeholder);
  });

  it('should handle value changes in textarea', () => {
    render(<SecretInput {...defaultProps} />);

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'new secret value' } });

    expect(textarea).toHaveValue('new secret value');
  });

  it('should respect disabled prop in textarea when not configured', () => {
    render(<SecretInput {...defaultProps} disabled={true} />);

    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeDisabled();
  });
});
