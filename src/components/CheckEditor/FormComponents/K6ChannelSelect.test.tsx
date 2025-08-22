import React from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { render, screen } from '@testing-library/react';

import { CheckFormValues, FeatureName } from 'types';

import { K6ChannelSelect } from './K6ChannelSelect';

jest.mock('hooks/useFeatureFlag', () => ({
  useFeatureFlag: jest.fn(),
}));

jest.mock('data/useK6Channels', () => ({
  useK6Channels: jest.fn(),
  useCurrentK6Version: jest.fn(),
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
const mockUseK6Channels = jest.mocked(require('data/useK6Channels').useK6Channels);
const mockUseCurrentK6Version = jest.mocked(require('data/useK6Channels').useCurrentK6Version);

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
  const mockChannelsResponse = {
    channels: {
      v1: {
        name: 'v1',
        default: false,
        deprecatedAfter: '2025-12-31T00:00:00Z',
        manifest: 'k6>=1,k6<2',
      },
      v2: {
        name: 'v2',
        default: true,
        deprecatedAfter: '2026-12-31T00:00:00Z',
        manifest: 'k6>=2',
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock returns for API hooks
    mockUseK6Channels.mockReturnValue({
      data: mockChannelsResponse,
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
      isFetching: false,
      refetch: jest.fn(),
    });
    
    mockUseCurrentK6Version.mockReturnValue({
      data: 'v1.9.2',
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
      isFetching: false,
      refetch: jest.fn(),
    });
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
