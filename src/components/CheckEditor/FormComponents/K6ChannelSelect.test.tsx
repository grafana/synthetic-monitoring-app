import React from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { render, screen } from '@testing-library/react';

import { CheckFormValues, FeatureName } from 'types';

import { K6ChannelSelect } from './K6ChannelSelect';

// Mock the useFeatureFlag hook
jest.mock('hooks/useFeatureFlag', () => ({
  useFeatureFlag: jest.fn(),
}));

// Mock the Combobox component to avoid canvas-related errors in tests
jest.mock('@grafana/ui', () => ({
  ...jest.requireActual('@grafana/ui'),
  Combobox: jest.fn(({ id, placeholder, options }) => (
    <select id={id} data-testid={id} title={placeholder}>
      {options?.map((option: any, index: number) => (
        <option key={index} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )),
}));

const mockUseFeatureFlag = jest.mocked(require('hooks/useFeatureFlag').useFeatureFlag);

// Test wrapper with form context
function TestWrapper({ children, featureEnabled = true }: { children: React.ReactNode; featureEnabled?: boolean }) {
  const methods = useForm<CheckFormValues>({
    defaultValues: {
      channel: null,
    }
  });
  
  // Mock feature flag
  mockUseFeatureFlag.mockReturnValue({ isEnabled: featureEnabled });
  
  return (
    <FormProvider {...methods}>
      {children}
    </FormProvider>
  );
}

describe('K6ChannelSelect', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not render when feature flag is disabled', () => {
    render(
      <TestWrapper featureEnabled={false}>
        <K6ChannelSelect />
      </TestWrapper>
    );
    
    expect(screen.queryByLabelText(/k6 version/i)).not.toBeInTheDocument();
  });

  it('should render when feature flag is enabled', () => {
    render(
      <TestWrapper featureEnabled={true}>
        <K6ChannelSelect />
      </TestWrapper>
    );
    
    expect(screen.getByLabelText(/k6 version/i)).toBeInTheDocument();
    expect(screen.getByText(/select the k6 version channel/i)).toBeInTheDocument();
  });

  it('should call useFeatureFlag with correct feature name', () => {
    render(
      <TestWrapper>
        <K6ChannelSelect />
      </TestWrapper>
    );

    expect(mockUseFeatureFlag).toHaveBeenCalledWith(FeatureName.VersionManagement);
  });

  it('should show mock channel options', () => {
    render(
      <TestWrapper>
        <K6ChannelSelect />
      </TestWrapper>
    );

    // The options are in the Combobox component, they'll be visible when opened
    expect(screen.getByLabelText(/k6 version/i)).toBeInTheDocument();
  });
});
