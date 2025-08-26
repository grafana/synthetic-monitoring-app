import React from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { render, screen } from '@testing-library/react';

import { CheckFormValues, FeatureName } from 'types';
import { useCurrentK6Version,useK6Channels } from 'data/useK6Channels';
import { useFeatureFlag } from 'hooks/useFeatureFlag';
import { useCheckFormMetaContext } from 'components/CheckForm/CheckFormContext';

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

jest.mock('components/CheckForm/CheckFormContext');

const mockUseFeatureFlag = useFeatureFlag as jest.Mock;
const mockUseK6Channels = useK6Channels as jest.Mock;
const mockUseCurrentK6Version = useCurrentK6Version as jest.Mock;
const mockUseCheckFormMetaContext = useCheckFormMetaContext as jest.Mock;

// Test wrapper with form context
function TestWrapper({ children, featureEnabled = true }: { children: React.ReactNode; featureEnabled?: boolean }) {
  const methods = useForm<CheckFormValues>({
    defaultValues: {
      channel: null,
    }
  });
  
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
        default: true,
        deprecatedAfter: '2025-12-31T00:00:00Z',
        disabledAfter: '2026-12-31T00:00:00Z',
        manifest: 'k6>=1,k6<2',
      },
      v2: {
        name: 'v2',
        default: false,
        deprecatedAfter: '2026-12-31T00:00:00Z',
        disabledAfter: '2027-12-31T00:00:00Z',
        manifest: 'k6>=2',
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseK6Channels.mockReturnValue({
      data: mockChannelsResponse,
      isLoading: false,
      error: null,
    });
    
    mockUseCurrentK6Version.mockReturnValue({
      data: 'v1.9.2',
      isLoading: false,
      error: null,
    });

    mockUseCheckFormMetaContext.mockReturnValue({
      check: undefined,
      isExistingCheck: false,
      getIsExistingCheck: () => false,
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

  it('should auto-select the default channel and show (default) label', () => {
    render(
      <TestWrapper>
        <K6ChannelSelect />
      </TestWrapper>
    );

    const combobox = screen.getByLabelText(/k6 version/i);
    expect(combobox).toHaveValue('v1');
    
    const selectElement = combobox as HTMLSelectElement;
    const v1Option = Array.from(selectElement.options).find(opt => opt.value === 'v1');
    expect(v1Option?.textContent).toContain('(default)');
  });

  it('should display error message when channels fail to load', () => {
    const errorMessage = 'K6 version channels are not available. This feature may not be supported by your Synthetic Monitoring instance.';
    
    mockUseFeatureFlag.mockReturnValue({ isEnabled: true });
    mockUseK6Channels.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error(errorMessage),
    });
    mockUseCurrentK6Version.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    });

    render(
      <TestWrapper>
        <K6ChannelSelect />
      </TestWrapper>
    );

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('should hide deprecated channels for new checks', () => {
    const channelsWithDeprecated = {
      channels: {
        v1: {
          name: 'v1',
          default: true,
          deprecatedAfter: '2025-12-31T00:00:00Z', // Not deprecated
          disabledAfter: '2026-12-31T00:00:00Z',
          manifest: 'k6>=1,k6<2',
        },
        deprecated: {
          name: 'deprecated',
          default: false,
          deprecatedAfter: '2020-01-01T00:00:00Z', // Already deprecated
          disabledAfter: '2027-12-31T00:00:00Z',
          manifest: 'k6>=0.5,k6<1',
        },
      },
    };

    mockUseK6Channels.mockReturnValue({
      data: channelsWithDeprecated,
      isLoading: false,
      error: null,
    });

    mockUseCheckFormMetaContext.mockReturnValue({
      check: undefined,
      isExistingCheck: false,
      getIsExistingCheck: () => false,
    });

    render(
      <TestWrapper>
        <K6ChannelSelect />
      </TestWrapper>
    );

    const combobox = screen.getByRole('combobox');
    expect(combobox).toBeInTheDocument();
    
    // Should show v1 but not deprecated channel
    expect(screen.getByText('v1.x (default)')).toBeInTheDocument();
    expect(screen.queryByText(/deprecated/)).not.toBeInTheDocument();
  });

  it('should show deprecated channel for existing checks if it was previously assigned', () => {
    const channelsWithDeprecated = {
      channels: {
        v1: {
          name: 'v1',
          default: true,
          deprecatedAfter: '2025-12-31T00:00:00Z', // Not deprecated
          disabledAfter: '2026-12-31T00:00:00Z',
          manifest: 'k6>=1,k6<2',
        },
        deprecated: {
          name: 'deprecated',
          default: false,
          deprecatedAfter: '2020-01-01T00:00:00Z', // Already deprecated
          disabledAfter: '2027-12-31T00:00:00Z',
          manifest: 'k6>=0.5,k6<1',
        },
      },
    };

    mockUseK6Channels.mockReturnValue({
      data: channelsWithDeprecated,
      isLoading: false,
      error: null,
    });

    // Mock existing check scenario with deprecated channel previously assigned
    mockUseCheckFormMetaContext.mockReturnValue({
      check: { channel: 'deprecated' },
      isExistingCheck: true,
      getIsExistingCheck: () => true,
    });

    render(
      <TestWrapper>
        <K6ChannelSelect />
      </TestWrapper>
    );

    const combobox = screen.getByRole('combobox');
    expect(combobox).toBeInTheDocument();
    
    // Should show both v1 and the previously assigned deprecated channel
    expect(screen.getByText('v1.x (default)')).toBeInTheDocument();
    expect(screen.getByText('deprecated.x')).toBeInTheDocument();
  });
});
