import { ComponentProps } from 'react';
import { screen } from '@testing-library/react';

import { getFieldErrorProps } from '../../../utils/form';
import { formTestRenderer } from '../__test__/formTestRenderer';
import { GenericTextareaField } from './GenericTextareaField';

jest.mock('../../../utils/form', () => ({
  getFieldErrorProps: jest.fn((errors, field, interpolationVariables) => ({
    error: field === 'error-field' ? 'This is a mocked error message' : undefined,
    invalid: field === 'error-field',
  })),
}));

const defaultProps = {
  field: 'value',
  label: 'Test Label',
  defaultValue: '',
} as any;

function renderGenericTextareaField(
  props?: Partial<ComponentProps<typeof GenericTextareaField>>,
  formValues: any = { value: '' }
) {
  return formTestRenderer(GenericTextareaField, { ...defaultProps, ...props }, formValues);
}

describe('GenericTextareaField', () => {
  it('renders a textarea with label', () => {
    renderGenericTextareaField();

    expect(screen.getByText(defaultProps.label)).toBeInTheDocument();
    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeInTheDocument();
  });

  it('renders textarea with description', () => {
    renderGenericTextareaField({
      description: 'Enter the request body content',
    });

    expect(screen.getByText('Enter the request body content')).toBeInTheDocument();
  });

  it('renders textarea with placeholder', () => {
    renderGenericTextareaField({
      placeholder: 'Enter JSON payload here...',
    });

    const textarea = screen.getByPlaceholderText('Enter JSON payload here...');
    expect(textarea).toBeInTheDocument();
  });

  it('reflects default value from form', () => {
    const bodyContent = '{"key": "value", "number": 42}';
    renderGenericTextareaField(undefined, { value: bodyContent });

    const textarea = screen.getByDisplayValue(bodyContent);
    expect(textarea).toBeInTheDocument();
  });

  it('handles user input correctly', async () => {
    const user = renderGenericTextareaField({
      field: 'settings.http.body' as any,
      label: 'Request Body',
    });

    const textarea = screen.getByRole('textbox');
    const newContent = 'New textarea content';

    await user.type(textarea, newContent);

    expect(textarea).toHaveValue(newContent);
  });

  it('is disabled when form is disabled', () => {
    renderGenericTextareaField(undefined, { disabled: true });
    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeDisabled();
  });

  it('sets custom number of rows when specified', () => {
    renderGenericTextareaField({
      rows: 10,
    });

    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('rows', '10');
  });

  it('uses default rows when not specified', () => {
    renderGenericTextareaField();

    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('rows', '5');
  });

  it('displays required indicator when required prop is true', () => {
    renderGenericTextareaField({
      required: true,
    });

    expect(screen.getByText(`${defaultProps.label} *`)).toBeInTheDocument();
  });

  it('sets id', () => {
    renderGenericTextareaField();

    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('id');
  });

  it('sets aria-label from label prop', () => {
    renderGenericTextareaField();

    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('aria-label', defaultProps.label);
  });

  it('renders without label when not provided', () => {
    renderGenericTextareaField({
      label: undefined,
    });

    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeInTheDocument();
  });

  it('handles content with special characters', () => {
    const specialContent = '{"message": "Hello, World! 🌍", "timestamp": "2023-01-01T00:00:00Z"}';

    renderGenericTextareaField(undefined, { value: specialContent });

    const textarea = screen.getByDisplayValue(specialContent);
    expect(textarea).toBeInTheDocument();
  });

  it('handles empty content', () => {
    renderGenericTextareaField(undefined, { value: '' });

    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveValue('');
  });

  it('applies custom className when provided', () => {
    renderGenericTextareaField({
      className: 'custom-textarea-class',
    });

    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveClass('custom-textarea-class');
  });

  it('handles interpolation variables for error messages', () => {
    const interpolationVariables = {
      maxLength: '1000',
      fieldName: 'body',
    };

    renderGenericTextareaField({
      interpolationVariables,
    });

    expect(getFieldErrorProps).toHaveBeenCalledWith({}, defaultProps.field, interpolationVariables);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('preserves whitespace and formatting', () => {
    const formattedContent = `  {
    "nested": {
      "object": true,
      "array": [1, 2, 3]
    }
  }`;

    renderGenericTextareaField(undefined, { value: formattedContent } as any);

    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveValue(formattedContent);
  });

  it('updates form value when content changes', async () => {
    const user = renderGenericTextareaField();

    const textarea = screen.getByRole('textbox');
    const initialContent = 'Initial content';
    const updatedContent = 'Updated content';

    // Set initial content
    await user.type(textarea, initialContent);
    expect(textarea).toHaveValue(initialContent);

    // Clear and update content
    await user.clear(textarea);
    await user.type(textarea, updatedContent);
    expect(textarea).toHaveValue(updatedContent);
  });
});
