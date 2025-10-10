import React from 'react';
import { screen } from '@testing-library/react';

import { formTestRenderer } from '../__test__/formTestRenderer';
import { GenericLegacyAlertingField } from './GenericLegacyAlertingField';

// Mock the CheckFormAlert component since it has complex dependencies
jest.mock('components/CheckFormAlert', () => ({
  CheckFormAlert: jest.fn((props) => (
    <div data-testid="check-form-alert">
      <h3>Legacy Alerting Configuration</h3>
      <div>Props: {JSON.stringify(props)}</div>
    </div>
  )),
}));

function renderGenericLegacyAlertingField() {
  return formTestRenderer(GenericLegacyAlertingField);
}

describe('GenericLegacyAlertingField', () => {
  it('renders the CheckFormAlert component (this is just an alias)', () => {
    renderGenericLegacyAlertingField();

    const alertComponent = screen.getByTestId('check-form-alert');
    expect(alertComponent).toBeInTheDocument();
    expect(screen.getByText('Legacy Alerting Configuration')).toBeInTheDocument();
  });
});
