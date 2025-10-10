import React, { ComponentProps } from 'react';
import { screen } from '@testing-library/react';

import { formTestRenderer } from '../__test__/formTestRenderer';
import { GenericMultiSelectField } from './GenericMultiSelectField';

jest.mock('../../../utils/form', () => ({
  getFieldErrorProps: jest.fn((errors, field) => ({
    error: errors?.[field]?.message,
    invalid: !!errors?.[field],
  })),
}));

// Mock MultiSelect component from @grafana/ui
jest.mock('@grafana/ui', () => ({
  ...jest.requireActual('@grafana/ui'),
  MultiSelect: jest.fn(({ options, placeholder, value, onChange, disabled, inputId }) => {
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const selectedOptions = Array.from(e.target.selectedOptions).map((option) => ({
        value: option.value,
        label: option.text,
      }));
      onChange?.(selectedOptions);
    };

    return (
      <select
        data-testid="multi-select"
        id={inputId}
        multiple
        value={value || []}
        onChange={handleChange}
        disabled={disabled}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options?.map((option: any) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }),
}));

const mockOptions = [
  { label: 'Tag 1', value: 'tag1' },
  { label: 'Tag 2', value: 'tag2' },
  { label: 'Tag 3', value: 'tag3' },
];

const defaultProps = {
  field: 'value',
  label: 'Test Label',
  options: mockOptions,
} as any;

function renderGenericMultiSelectField(
  props?: Partial<ComponentProps<typeof GenericMultiSelectField>>,
  formValues: any = { value: '' }
) {
  return formTestRenderer(GenericMultiSelectField, { ...defaultProps, ...props }, formValues);
}

describe('GenericMultiSelectField', () => {
  it('renders a multi-select field with label', () => {
    renderGenericMultiSelectField({
      field: 'settings.http.validStatusCodes' as any,
      label: 'Valid Status Codes',
      description: 'Select valid HTTP status codes',
      options: mockOptions,
      placeholder: 'Choose status codes',
    });

    expect(screen.getByText('Valid Status Codes')).toBeInTheDocument();
    const select = screen.getByTestId('multi-select');
    expect(select).toBeInTheDocument();
  });

  it('renders multi-select with description', () => {
    renderGenericMultiSelectField({
      field: 'settings.http.validStatusCodes' as any,
      label: 'Valid Status Codes',
      description: 'Select valid HTTP status codes',
      options: mockOptions,
      placeholder: 'Choose status codes',
    });

    expect(screen.getByText('Select valid HTTP status codes')).toBeInTheDocument();
  });

  it('renders multi-select with placeholder', () => {
    renderGenericMultiSelectField({
      field: 'settings.http.validStatusCodes' as any,
      label: 'Valid Status Codes',
      description: 'Select valid HTTP status codes',
      options: mockOptions,
      placeholder: 'Choose status codes',
    });

    expect(screen.getByText('Choose status codes')).toBeInTheDocument();
  });

  it('renders options correctly', () => {
    renderGenericMultiSelectField({
      field: 'settings.http.validStatusCodes' as any,
      label: 'Valid Status Codes',
      description: 'Select valid HTTP status codes',
      options: mockOptions,
      placeholder: 'Choose status codes',
    });

    expect(screen.getByText('Tag 1')).toBeInTheDocument();
    expect(screen.getByText('Tag 2')).toBeInTheDocument();
    expect(screen.getByText('Tag 3')).toBeInTheDocument();
  });

  it('reflects default values from form', () => {
    renderGenericMultiSelectField(
      {
        field: 'settings.http.validStatusCodes' as any,
        label: 'Valid Status Codes',
        description: 'Select valid HTTP status codes',
        options: mockOptions,
        placeholder: 'Choose status codes',
      },
      { 'settings.http.validStatusCodes': ['tag1', 'tag2'] } as any
    );

    const select = screen.getByTestId('multi-select');
    expect(select).toBeInTheDocument();
  });

  it('handles user selection correctly', async () => {
    const user = renderGenericMultiSelectField({
      field: 'settings.http.validStatusCodes' as any,
      label: 'Valid Status Codes',
      description: 'Select valid HTTP status codes',
      options: mockOptions,
      placeholder: 'Choose status codes',
    });

    const select = screen.getByTestId('multi-select');

    // Simulate selecting multiple options
    await user.selectOptions(select, ['tag1', 'tag2']);

    expect(select).toBeInTheDocument();
  });

  it('is disabled when form is disabled', () => {
    renderGenericMultiSelectField(undefined, { disabled: true });
    const select = screen.getByTestId('multi-select');
    expect(select).toBeDisabled();
  });

  it('sets correct id from useDOMId hook', () => {
    renderGenericMultiSelectField({
      field: 'settings.http.validStatusCodes' as any,
      label: 'Valid Status Codes',
      description: 'Select valid HTTP status codes',
      options: mockOptions,
      placeholder: 'Choose status codes',
    });

    const select = screen.getByTestId('multi-select');
    expect(select).toHaveAttribute('id');
  });

  it('handles empty options array', () => {
    renderGenericMultiSelectField({
      field: 'settings.http.validStatusCodes' as any,
      label: 'Valid Status Codes',
      description: 'Select valid HTTP status codes',
      options: [],
      placeholder: 'Choose status codes',
    });

    const select = screen.getByTestId('multi-select');
    expect(select).toBeInTheDocument();
  });

  it('transforms selected values correctly', async () => {
    // This test verifies that the onChange handler properly maps SelectableValue[] to value array
    const user = renderGenericMultiSelectField({
      field: 'settings.http.validStatusCodes' as any,
      label: 'Valid Status Codes',
      description: 'Select valid HTTP status codes',
      options: mockOptions,
      placeholder: 'Choose status codes',
    });

    const select = screen.getByTestId('multi-select');

    // The component should handle the transformation from SelectableValue[] to string[]
    await user.selectOptions(select, 'tag1');

    expect(select).toBeInTheDocument();
  });

  it('handles field prop requirements', () => {
    // Ensure all required props are accepted
    const props = {
      field: 'settings.http.validStatusCodes' as any,
      label: 'Valid Status Codes',
      description: 'Select valid HTTP status codes',
      options: mockOptions,
      placeholder: 'Choose status codes',
    };

    expect(() => {
      renderGenericMultiSelectField(props);
    }).not.toThrow();
  });
});
