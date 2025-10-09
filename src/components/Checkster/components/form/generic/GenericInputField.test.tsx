import { ComponentProps } from 'react';
import { screen } from '@testing-library/react';

import { formTestRenderer, TestFormTestId } from '../__test__/formTestRenderer';
import { GenericInputField } from './GenericInputField';

const defaultProps = {
  field: 'value',
  label: 'Test Label',
} as any;

function renderGenericInputField(
  props?: Partial<ComponentProps<typeof GenericInputField>>,
  formValues: any = { value: '' }
) {
  return formTestRenderer(GenericInputField, { ...defaultProps, ...props }, formValues);
}

// Mock dependencies
jest.mock('../../../utils/form', () => ({
  getFieldErrorProps: jest.fn((errors, field, interpolationVariables) => ({
    error: field === 'error-field' ? 'This is a mocked error message' : undefined,
    invalid: field === 'error-field',
  })),
}));

describe('GenericInputField', () => {
  it('renders an input with label', () => {
    renderGenericInputField();

    expect(screen.getByText(defaultProps.label)).toBeInTheDocument();
    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
  });

  it('renders input with description', () => {
    renderGenericInputField({
      description: 'Test description text',
    });

    expect(screen.getByText('Test description text')).toBeInTheDocument();
  });

  it('renders input with placeholder', () => {
    renderGenericInputField({
      placeholder: 'Test placeholder',
    });

    const input = screen.getByPlaceholderText('Test placeholder');
    expect(input).toBeInTheDocument();
  });

  it('renders number input when type is number (valueAsNumber)', async () => {
    const user = renderGenericInputField(
      {
        type: 'number',
      },
      { value: 0 } // not required for the test to pass, but silences console.warn
    );

    const input = screen.getByRole('spinbutton'); // TDI
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'number');
    const info = screen.getByTestId(TestFormTestId.TypeOf);
    await user.type(input, '25');
    expect(info).toHaveTextContent('number'); // make sure that `valueAsNumber` works
  });

  it('renders text input by default', () => {
    renderGenericInputField();

    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('type', 'text');
  });

  it('reflects default value from form', () => {
    renderGenericInputField(undefined, { [defaultProps.field]: 'test-form-value' });

    const input = screen.getByDisplayValue('test-form-value');
    expect(input).toBeInTheDocument();
  });

  it('handles user input correctly', async () => {
    const user = renderGenericInputField();

    const input = screen.getByRole('textbox');
    await user.type(input, 'new value');

    expect(input).toHaveValue('new value');
  });

  it('is disabled when form is disabled', () => {
    renderGenericInputField(undefined, { disabled: true });
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });

  it('displays required indicator when required prop is true', () => {
    renderGenericInputField({
      required: true,
    });

    expect(screen.getByText('Test Label *')).toBeInTheDocument();
  });

  it('handles password input type', () => {
    renderGenericInputField({
      type: 'password',
    });

    const input = screen.getByLabelText(defaultProps.label);
    expect(input).toHaveAttribute('type', 'password');
  });

  it('handles email input type', () => {
    renderGenericInputField({
      type: 'email',
    });

    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('type', 'email');
  });

  it('handles number input with default value', () => {
    renderGenericInputField(
      {
        type: 'number',
      },
      { value: 5000 }
    );

    const input = screen.getByDisplayValue('5000');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'number');
  });

  it('shows errors when field is invalid', async () => {
    // @ts-expect-error 'error-field' is reserved to have validation error props (see `getFieldErrorProps` mock)
    renderGenericInputField({ field: 'error-field' });
    const element = screen.getByRole('alert');
    expect(element).toBeInTheDocument();
  });

  it('shows no errors when field is valid', async () => {
    renderGenericInputField();
    const element = screen.queryByRole('alert');
    expect(element).not.toBeInTheDocument();
  });
});
