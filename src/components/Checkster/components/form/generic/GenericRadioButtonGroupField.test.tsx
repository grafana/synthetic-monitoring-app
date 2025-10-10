import { ComponentProps } from 'react';
import { screen } from '@testing-library/react';

import { formTestRenderer } from '../__test__/formTestRenderer';
import { GenericRadioButtonGroupField } from './GenericRadioButtonGroupField';

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
  options: mockOptions,
} as any;

function renderGenericRadioButtonGroupField(
  props?: Partial<ComponentProps<typeof GenericRadioButtonGroupField>>,
  formValues: any = { value: '' }
) {
  return formTestRenderer(GenericRadioButtonGroupField, { ...defaultProps, ...props }, formValues);
}

describe('GenericRadioButtonGroupField', () => {
  it('renders a radio button group with label', () => {
    renderGenericRadioButtonGroupField();

    expect(screen.getByText(defaultProps.label)).toBeInTheDocument();
    const radioGroup = screen.getByRole('radiogroup');
    expect(radioGroup).toBeInTheDocument();
  });

  it('renders radio button group with description', () => {
    renderGenericRadioButtonGroupField({
      description: 'Choose IP version to use',
    });

    expect(screen.getByText('Choose IP version to use')).toBeInTheDocument();
  });

  it('renders all radio button options', () => {
    renderGenericRadioButtonGroupField();

    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
    expect(screen.getByText('Option 3')).toBeInTheDocument();

    const radioButtons = screen.getAllByRole('radio');
    expect(radioButtons).toHaveLength(3);
  });

  it('reflects default value from form', () => {
    renderGenericRadioButtonGroupField(undefined, { value: 'option2' } as any);

    const radioButton = screen.getByRole('radio', { name: /option 2/i });
    expect(radioButton).toBeChecked();
  });

  it('handles user selection correctly', async () => {
    const user = renderGenericRadioButtonGroupField();

    const radioButton = screen.getByRole('radio', { name: /option 1/i });
    await user.click(radioButton);

    expect(radioButton).toBeChecked();
  });

  it('allows changing selection', async () => {
    const user = renderGenericRadioButtonGroupField(undefined, { value: 'option1' });

    // Initially option1 should be selected
    expect(screen.getByRole('radio', { name: /option 1/i })).toBeChecked();

    // Click option2
    const option2Radio = screen.getByRole('radio', { name: /option 2/i });
    await user.click(option2Radio);

    expect(option2Radio).toBeChecked();
    expect(screen.getByRole('radio', { name: /option 1/i })).not.toBeChecked();
  });

  it('is disabled when form is disabled', () => {
    renderGenericRadioButtonGroupField(undefined, { disabled: true });
    const radioButtons = screen.getAllByRole('radio');
    radioButtons.forEach((radio) => {
      expect(radio).toBeDisabled();
    });
  });

  // An id is set, but not populated in the UI
  it.skip('sets correct id from for label', () => {
    renderGenericRadioButtonGroupField();

    const radioGroup = screen.getByRole('radiogroup');
    expect(radioGroup).toHaveAttribute('id');
  });

  it('handles empty options array', () => {
    renderGenericRadioButtonGroupField({
      options: [],
    });

    const radioGroup = screen.getByRole('radiogroup');
    expect(radioGroup).toBeInTheDocument();
    expect(screen.queryAllByRole('radio')).toHaveLength(0);
  });

  it('handles options with different value types', () => {
    const mixedOptions = [
      { label: 'IPv4', value: 'V4' },
      { label: 'IPv6', value: 'V6' },
      { label: 'Any', value: 'Any' },
    ];

    renderGenericRadioButtonGroupField({
      options: mixedOptions,
    });

    expect(screen.getByText('IPv4')).toBeInTheDocument();
    expect(screen.getByText('IPv6')).toBeInTheDocument();
    expect(screen.getByText('Any')).toBeInTheDocument();
  });

  it('ensures only one option can be selected at a time', async () => {
    const user = renderGenericRadioButtonGroupField();

    // Select option 1
    await user.click(screen.getByRole('radio', { name: /option 1/i }));
    expect(screen.getByRole('radio', { name: /option 1/i })).toBeChecked();

    // Select option 2
    await user.click(screen.getByRole('radio', { name: /option 2/i }));
    expect(screen.getByRole('radio', { name: /option 2/i })).toBeChecked();
    expect(screen.getByRole('radio', { name: /option 1/i })).not.toBeChecked();

    // Select option 3
    await user.click(screen.getByRole('radio', { name: /option 3/i }));
    expect(screen.getByRole('radio', { name: /option 3/i })).toBeChecked();
    expect(screen.getByRole('radio', { name: /option 1/i })).not.toBeChecked();
    expect(screen.getByRole('radio', { name: /option 2/i })).not.toBeChecked();
  });
});
