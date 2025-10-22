import { ComponentProps } from 'react';
import { screen } from '@testing-library/react';

import { formTestRenderer } from '../__test__/formTestRenderer';
import { GenericInputSelectField } from './GenericInputSelectField';

jest.mock('../../../utils/form', () => ({
  getFieldErrorProps: jest.fn((errors, field, interpolationVariables) => ({
    error: field === 'error-field' ? 'This is a mocked error message' : undefined,
    invalid: field === 'error-field',
  })),
}));

const mockOptions = [
  { label: 'Option 1', value: 'option1' },
  { label: 'Option 2', value: 'option2' },
  { label: 'Option 3', value: 'option3' },
];

const defaultProps = {
  field: 'value',
  label: 'Test Label',
  defaultValue: '',
  options: mockOptions,
} as any;

function renderGenericInputSelectField(
  props?: Partial<ComponentProps<typeof GenericInputSelectField>>,
  formValues: any = { value: '' }
) {
  return formTestRenderer(GenericInputSelectField, { ...defaultProps, ...props }, formValues);
}

describe('GenericInputSelectField', () => {
  it('renders a select field with label', () => {
    renderGenericInputSelectField(undefined, { value: 'HTTP Method' });
    const select = screen.getByRole('combobox');
    expect(select).toHaveTextContent('HTTP Method');
  });

  it('renders select with description', () => {
    renderGenericInputSelectField({
      description: 'Select the HTTP method to use',
    });

    expect(screen.getByText('Select the HTTP method to use')).toBeInTheDocument();
  });

  it('renders select with placeholder', () => {
    renderGenericInputSelectField({
      placeholder: 'Choose test method',
    });

    expect(screen.getByText('Choose test method')).toBeInTheDocument();
  });

  it('renders options correctly', async () => {
    const user = renderGenericInputSelectField();
    const select = screen.getByRole('combobox');

    await user.click(select);

    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
    expect(screen.getByText('Option 3')).toBeInTheDocument();
  });

  it('reflects default value from form', () => {
    renderGenericInputSelectField(undefined, { value: 'option2' });

    const select = screen.getByRole('combobox');
    expect(select).toHaveValue('option2');
  });

  it('handles user selection correctly', async () => {
    const user = renderGenericInputSelectField({
      field: 'settings.http.method' as any,
      label: 'HTTP Method',
      options: mockOptions,
    });

    const select = screen.getByRole('combobox');
    await user.click(select);
    const option2 = screen.getByText('Option 2');
    await user.click(option2);
    expect(select).toHaveValue('option2');
  });

  it('is disabled when form is disabled', () => {
    renderGenericInputSelectField(undefined, { disabled: true });
    const select = screen.getByRole('combobox');
    expect(select).toBeDisabled();
  });

  // Fixme: would be swell to test this
  it.skip('applies custom width when specified', () => {
    renderGenericInputSelectField({
      width: 10,
    });

    const select = screen.getByRole('combobox');
    expect(select.getBoundingClientRect().width).toBe(10 * 16);
  });

  // Fixme: would be swell to test this
  it.skip('does not apply width when width is 0', () => {
    renderGenericInputSelectField({
      width: 0,
    });

    const select = screen.getByRole('combobox');
    expect(select.getBoundingClientRect().width).toBe(0); // not actually 0
  });

  it.todo('uses default width of 20 when no width specified');

  it('applies custom className when provided', () => {
    renderGenericInputSelectField({
      className: 'custom-class',
    });

    const select = screen.getByRole('combobox');
    expect(select.parentElement).toHaveClass('custom-class');
  });

  it('handles empty options array', () => {
    renderGenericInputSelectField({
      options: [],
    });

    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
  });
});
