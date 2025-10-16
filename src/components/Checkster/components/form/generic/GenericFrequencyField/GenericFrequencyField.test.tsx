import React, { ComponentProps } from 'react';
import { screen } from '@testing-library/react';

import { CheckType } from 'types';

import { formTestRenderer } from '../../__test__/formTestRenderer';
import { GenericFrequencyField } from './GenericFrequencyField';

// Mock the ChecksterContext
const mockChecksterContext = {
  checkType: CheckType.HTTP, // Add other context properties as needed
};

jest.mock('../../../../contexts/ChecksterContext', () => ({
  useChecksterContext: () => mockChecksterContext,
}));

// Mock the Frequency component since it has complex dependencies
jest.mock('components/CheckEditor/FormComponents/Frequency', () => ({
  Frequency: jest.fn(({ checkType, disabled }) => (
    <div data-testid="frequency-component">
      <h3>Frequency Configuration</h3>
      <div>Check Type: {checkType}</div>
      <div>Disabled: {disabled ? 'true' : 'false'}</div>
      <select data-testid="frequency-select">
        <option value="60000">1 minute</option>
        <option value="300000">5 minutes</option>
        <option value="900000">15 minutes</option>
      </select>
    </div>
  )),
}));

const defaultProps = {
  field: 'value',
  label: 'Test Label',
  defaultValue: 60 * 1000, // 60s in ms
} as any;

function renderGenericFrequencyField(
  props?: Partial<ComponentProps<typeof GenericFrequencyField>>,
  formValues: any = { value: '' }
) {
  return formTestRenderer(GenericFrequencyField, { ...defaultProps, ...props }, formValues);
}

describe('GenericFrequencyField', () => {
  beforeEach(() => {
    // Reset mock context before each test
    mockChecksterContext.checkType = CheckType.HTTP;
  });

  it('renders the Frequency component', () => {
    renderGenericFrequencyField();

    const frequencyComponent = screen.getByTestId('frequency-component');
    expect(frequencyComponent).toBeInTheDocument();
    expect(screen.getByText('Frequency Configuration')).toBeInTheDocument();
  });

  describe('passes check type from context to Frequency component', () => {
    it.each(Object.values(CheckType))('%s', (checkType) => {
      mockChecksterContext.checkType = checkType;
      renderGenericFrequencyField();

      expect(screen.getByText(`Check Type: ${checkType}`)).toBeInTheDocument();
    });
  });

  it('passes disabled state from form to Frequency component', () => {
    renderGenericFrequencyField(undefined, { disabled: true });

    expect(screen.getByText('Disabled: true')).toBeInTheDocument();
  });

  it('passes enabled state from form to Frequency component', () => {
    renderGenericFrequencyField(undefined, { disabled: false });

    expect(screen.getByText('Disabled: false')).toBeInTheDocument();
  });
});
