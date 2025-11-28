import { ComponentProps } from 'react';
import { screen, waitFor } from '@testing-library/react';

import { ChecksterProvider } from '../../../contexts/ChecksterContext';
import { formTestRenderer } from '../__test__/formTestRenderer';
import { GenericNameValueField } from './GenericNameValueField';

// Mock dependencies
jest.mock('../../../utils/form', () => ({
  ...jest.requireActual('../../../utils/form'),
  getFieldErrorProps: jest.fn((errors, field, interpolationVariables) => ({
    error: errors?.[field]?.message,
    invalid: !!errors?.[field],
  })),
}));

jest.mock('@grafana/ui', () => ({
  ...jest.requireActual('@grafana/ui'),
  useStyles2: jest.fn(() => ({
    row: 'row-class',
    field: 'field-class',
  })),
}));

jest.mock('data/useProbes', () => ({
  useProbesWithMetadata: jest.fn(() => ({
    data: [],
    isLoading: false,
  })),
}));

const defaultProps = {
  field: 'labels',
  label: 'Labels',
} as any;

function renderGenericNameValueField(
  props?: Partial<ComponentProps<typeof GenericNameValueField>>,
  formValues: any = { value: '' }
) {
  return formTestRenderer(GenericNameValueField, { ...defaultProps, ...props }, formValues, ChecksterProvider);
}

describe('GenericNameValueField', () => {
  it('renders with label and description', () => {
    renderGenericNameValueField({
      field: 'labels',
      label: 'Labels',
      description: 'Add key-value labels',
    });

    expect(screen.getByText('Labels')).toBeInTheDocument();
    expect(screen.getByText('Add key-value labels')).toBeInTheDocument();
  });

  it('renders add button with default text', () => {
    renderGenericNameValueField({
      field: 'labels',
      label: 'Labels',
    });

    const addButton = screen.getByRole('button', { name: /row/i });
    expect(addButton).toBeInTheDocument();
  });

  it('renders add button with custom text', () => {
    renderGenericNameValueField({
      field: 'labels',
      label: 'Labels',
      addButtonText: 'Add Label',
    });

    const addButton = screen.getByRole('button', { name: /add label/i });
    expect(addButton).toBeInTheDocument();
  });

  it('displays existing name-value pairs', () => {
    renderGenericNameValueField(
      {
        field: 'labels',
        label: 'Labels',
      },
      {
        labels: [
          { name: 'env', value: 'production' },
          { name: 'team', value: 'backend' },
        ],
      }
    );

    expect(screen.getByDisplayValue('env')).toBeInTheDocument();
    expect(screen.getByDisplayValue('production')).toBeInTheDocument();
    expect(screen.getByDisplayValue('team')).toBeInTheDocument();
    expect(screen.getByDisplayValue('backend')).toBeInTheDocument();
  });

  it('shows remove buttons for existing rows', () => {
    renderGenericNameValueField(
      {
        field: 'labels',
        label: 'Labels',
      },
      {
        labels: [
          { name: 'env', value: 'production' },
          { name: 'team', value: 'backend' },
        ],
      }
    );

    const removeButtons = screen.getAllByRole('button', { name: /Remove/i });
    expect(removeButtons).toHaveLength(2);
  });

  it('adds new row when add button is clicked', async () => {
    const user = renderGenericNameValueField({
      field: 'labels',
      label: 'Labels',
    });

    const addButton = screen.getByRole('button', { name: /row/i });
    await user.click(addButton);

    // Should have name and value inputs for the new row
    const nameInputs = screen.getAllByPlaceholderText('Name');
    const valueInputs = screen.getAllByPlaceholderText('Value');

    expect(nameInputs).toHaveLength(1);
    expect(valueInputs).toHaveLength(1);
  });

  it('removes row when remove button is clicked', async () => {
    const user = renderGenericNameValueField(
      {
        field: 'labels',
        label: 'Labels',
      },
      {
        labels: [
          { name: 'env', value: 'production' },
          { name: 'team', value: 'backend' },
        ],
      }
    );

    const removeButtons = screen.getAllByRole('button', { name: /remove/i });
    await user.click(removeButtons[0]);

    // Should only have one set of inputs left
    expect(screen.getByDisplayValue('team')).toBeInTheDocument();
    expect(screen.getByDisplayValue('backend')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('env')).not.toBeInTheDocument();
  });

  it('uses custom placeholders when provided', () => {
    renderGenericNameValueField(
      {
        field: 'labels',
        label: 'Labels',
        namePlaceholder: 'Key',
        valuePlaceholder: 'Val',
      },
      {
        labels: [{ name: '', value: '' }],
      }
    );

    expect(screen.getByPlaceholderText('Key')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Val')).toBeInTheDocument();
  });

  it('shows unregistered row when allowEmpty is true', () => {
    renderGenericNameValueField({
      field: 'labels',
      label: 'Labels',
      allowEmpty: true,
    });

    // Should show inputs for unregistered row (even when no existing rows)
    const nameInputs = screen.getAllByPlaceholderText('Name');
    const valueInputs = screen.getAllByPlaceholderText('Value');

    expect(nameInputs).toHaveLength(1);
    expect(valueInputs).toHaveLength(1);
  });

  it('does not show unregistered row when allowEmpty is not set', () => {
    renderGenericNameValueField({
      field: 'labels',
      label: 'Labels',
    });

    // Should not show any inputs when no existing rows and allowEmpty is false
    const nameInputs = screen.queryAllByPlaceholderText('Name');
    const valueInputs = screen.queryAllByPlaceholderText('Value');

    expect(nameInputs).toHaveLength(0);
    expect(valueInputs).toHaveLength(0);
  });

  it('registers unregistered row when user types in name field', async () => {
    const user = renderGenericNameValueField({
      field: 'labels',
      label: 'Labels',
      allowEmpty: true,
    });

    const nameInput = screen.getByPlaceholderText('Name');
    await user.type(nameInput, 'newkey');

    // After typing, should have 2 sets of inputs (the registered one and a new unregistered one)
    await waitFor(() => {
      const nameInputs = screen.getAllByPlaceholderText('Name');
      expect(nameInputs).toHaveLength(2);
    });
  });

  it('registers unregistered row when user types in value field', async () => {
    const user = renderGenericNameValueField({
      field: 'labels',
      label: 'Labels',
      allowEmpty: true,
    });

    const valueInput = screen.getByPlaceholderText('Value');
    await user.type(valueInput, 'newvalue');

    // After typing, should have 2 sets of inputs
    await waitFor(() => {
      const valueInputs = screen.getAllByPlaceholderText('Value');
      expect(valueInputs).toHaveLength(2);
    });
  });

  it('respects limit prop', () => {
    renderGenericNameValueField(
      {
        field: 'labels',
        label: 'Labels',
        limit: 2,
      },
      {
        labels: [
          { name: 'env', value: 'production' },
          { name: 'team', value: 'backend' },
        ],
      }
    );

    const addButton = screen.getByRole('button', { name: /row/i });
    expect(addButton).toBeDisabled();
  });

  it('does not show unregistered row when limit is reached', () => {
    renderGenericNameValueField(
      {
        field: 'labels',
        label: 'Labels',
        allowEmpty: true,
        limit: 1,
      },
      {
        labels: [{ name: 'env', value: 'production' }],
      }
    );

    // Should not show unregistered row when limit is reached
    const nameInputs = screen.getAllByPlaceholderText('Name');
    const valueInputs = screen.getAllByPlaceholderText('Value');

    expect(nameInputs).toHaveLength(1); // Only the existing row
    expect(valueInputs).toHaveLength(1);
  });

  it('shows name prefix when provided', () => {
    renderGenericNameValueField(
      {
        field: 'labels',
        label: 'Labels',
        namePrefix: '$',
      },
      {
        labels: [{ name: 'var', value: 'value' }],
      }
    );

    // The prefix would be rendered by the Input component
    expect(screen.getByDisplayValue('var')).toBeInTheDocument();
  });

  it('disables all inputs when form is disabled', () => {
    renderGenericNameValueField(undefined, {
      labels: [{ name: 'env', value: 'production' }],
      disabled: true,
    });

    const nameInput = screen.getByDisplayValue('env');
    const valueInput = screen.getByDisplayValue('production');
    const addButton = screen.getByRole('button', { name: /row/i });

    expect(nameInput).toBeDisabled();
    expect(valueInput).toBeDisabled();
    expect(addButton).toBeDisabled();
  });
});
