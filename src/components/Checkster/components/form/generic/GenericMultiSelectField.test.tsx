import { ComponentProps } from 'react';
import { screen } from '@testing-library/react';
import { testUsesCombobox } from 'test/utils';

import { formTestRenderer } from '../__test__/formTestRenderer';
import { GenericMultiSelectField } from './GenericMultiSelectField';

jest.mock('../../../utils/form', () => ({
  getFieldErrorProps: jest.fn((errors, field) => ({
    error: errors?.[field]?.message,
    invalid: !!errors?.[field],
  })),
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

const props = {
  field: 'settings.http.validStatusCodes' as any,
  label: 'Valid Status Codes',
  description: 'Select valid HTTP status codes',
  options: mockOptions,
  placeholder: 'Choose status codes',
};

describe('GenericMultiSelectField', () => {
  beforeEach(() => {
    testUsesCombobox();
  });

  it('renders a multi-select field with label', () => {
    renderGenericMultiSelectField(props);

    expect(screen.getByText(props.label)).toBeInTheDocument();
    const select = screen.getByPlaceholderText(props.placeholder);
    expect(select).toBeInTheDocument();
  });

  it('renders multi-select with description', () => {
    renderGenericMultiSelectField(props);
    expect(screen.getByText(props.description)).toBeInTheDocument();
  });

  it('renders multi-select with placeholder', () => {
    renderGenericMultiSelectField(props);

    expect(screen.getByPlaceholderText(props.placeholder)).toBeInTheDocument();
  });

  it('renders options correctly', async () => {
    const user = renderGenericMultiSelectField(props);
    await user.click(screen.getByPlaceholderText(props.placeholder));

    expect(screen.getByText(mockOptions[0].label)).toBeInTheDocument();
    expect(screen.getByText(mockOptions[1].label)).toBeInTheDocument();
    expect(screen.getByText(mockOptions[2].label)).toBeInTheDocument();
  });

  it('handles user selection correctly', async () => {
    const user = renderGenericMultiSelectField(props);
    await user.click(screen.getByPlaceholderText(props.placeholder));

    await user.click(screen.getByRole('option', { name: mockOptions[0].label }));
    await user.click(screen.getByRole('option', { name: mockOptions[1].label }));

    expect(screen.getByLabelText(`Remove ${mockOptions[0].label}`)).toBeInTheDocument();
    expect(screen.getByLabelText(`Remove ${mockOptions[1].label}`)).toBeInTheDocument();
    expect(screen.queryByLabelText(`Remove ${mockOptions[2].label}`)).not.toBeInTheDocument();
  });

  it('is disabled when form is disabled', () => {
    renderGenericMultiSelectField(props, { disabled: true });
    const select = screen.getByPlaceholderText(props.placeholder);
    expect(select).toBeDisabled();
  });

  it('sets correct id from useDOMId hook', () => {
    renderGenericMultiSelectField(props);

    const select = screen.getByPlaceholderText(props.placeholder);
    expect(select).toHaveAttribute('id');
  });

  it('handles empty options array', () => {
    renderGenericMultiSelectField({ ...props, options: [] });

    const select = screen.getByPlaceholderText(props.placeholder);
    expect(select).toBeInTheDocument();
  });
});
