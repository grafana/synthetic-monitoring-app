import React, { ComponentProps } from 'react';
import { screen } from '@testing-library/react';

import { formTestRenderer } from '../../__test__/formTestRenderer';
import { GenericAlertingField } from './index';

// Mock the AlertsPerCheck component since it has complex dependencies
jest.mock('components/CheckForm/AlertsPerCheck/AlertsPerCheck', () => ({
  AlertsPerCheck: jest.fn(() => (
    <div data-testid="alerts-per-check">
      <h3>Alerts Configuration</h3>
      <div>Mocked AlertsPerCheck Component</div>
    </div>
  )),
}));

const defaultProps = {
  field: 'alert',
  label: 'Test Label',
  defaultValue: '',
} as any;

function renderGenericAlertingField(
  props?: Partial<ComponentProps<typeof GenericAlertingField>>,
  formValues: any = { value: '' }
) {
  return formTestRenderer(GenericAlertingField, { ...defaultProps, ...props }, formValues);
}

describe('GenericAlertingField', () => {
  it('renders the AlertsPerCheck component', () => {
    renderGenericAlertingField({
      field: 'alerts',
    });

    const alertsComponent = screen.getByTestId('alerts-per-check');
    expect(alertsComponent).toBeInTheDocument();
    expect(screen.getByText('Alerts Configuration')).toBeInTheDocument();
    expect(screen.getByText('Mocked AlertsPerCheck Component')).toBeInTheDocument();
  });
});
