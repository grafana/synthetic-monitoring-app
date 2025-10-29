import { ComponentProps } from 'react';
import { screen } from '@testing-library/react';

import { formTestRenderer } from '../__test__/formTestRenderer';
import { GenericCheckboxField } from './GenericCheckboxField';

const defaultProps = {
  field: 'value',
  label: 'Test Label',
  defaultValue: '',
} as any;

function renderGenericCheckboxField(
  props?: Partial<ComponentProps<typeof GenericCheckboxField>>,
  formValues: any = { value: '' }
) {
  return formTestRenderer(GenericCheckboxField, { ...defaultProps, ...props }, formValues);
}

describe('GenericCheckboxField', () => {
  it('renders a checkbox with label', () => {
    renderGenericCheckboxField();

    const checkbox = screen.getByLabelText(defaultProps.label);
    expect(checkbox).toBeInTheDocument();
  });

  it('renders a checkbox with description', () => {
    renderGenericCheckboxField({
      description: 'Test description text',
    });

    expect(screen.getByText('Test description text')).toBeInTheDocument();
  });

  it('renders checkbox without label when not provided', () => {
    renderGenericCheckboxField();

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeInTheDocument();
  });

  it('reflects default value from form when checked', () => {
    renderGenericCheckboxField(undefined, { value: true });

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
  });

  it('reflects default value from form when unchecked', () => {
    renderGenericCheckboxField(undefined, { enabled: false });

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();
  });

  it('handles user interaction correctly', async () => {
    const user = renderGenericCheckboxField(undefined, { value: false });

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();

    await user.click(checkbox);
    expect(checkbox).toBeChecked();

    await user.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });

  it('is disabled when form is disabled', () => {
    renderGenericCheckboxField(undefined, { disabled: true });
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeDisabled();
  });
});
