import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { apiRoute } from 'test/handlers';
import { render } from 'test/render';
import { server } from 'test/server';
import { mockFeatureToggles } from 'test/utils';

import { CheckFormValuesBrowser, CheckType, FeatureName } from 'types';
import { ChecksterProvider } from 'components/Checkster/contexts/ChecksterContext';
import { setupChannelTest } from 'page/__testHelpers__/channel';

import { K6ChannelSelect } from './K6ChannelSelect';

const FormWrapper = ({ 
  children, 
  defaultValues,
  check,
  checkType = CheckType.Browser 
}: { 
  children: React.ReactNode; 
  defaultValues?: Partial<CheckFormValuesBrowser>;
  check?: any;
  checkType?: CheckType;
  }) => {
    return (
      <ChecksterProvider checkType={checkType} check={check}>
        {children}
      </ChecksterProvider>
    );
  };

describe('K6ChannelSelect', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not render when feature flag is disabled', () => {
    mockFeatureToggles({
      [FeatureName.VersionManagement]: false,
    });
    
    render(
      <FormWrapper>
        <K6ChannelSelect />
      </FormWrapper>
    );

    expect(screen.queryByLabelText(/k6 version/i)).not.toBeInTheDocument();
  });

  it('should render when feature flag is enabled', async () => {
    setupChannelTest();
    
    render(
      <FormWrapper>
        <K6ChannelSelect />
      </FormWrapper>
    );
    
    await waitFor(() => {
      expect(screen.getByLabelText(/k6 version/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/select the k6 version channel/i)).toBeInTheDocument();
  });

  it('should show mock channel options', async () => {
    setupChannelTest();
    
    render(
      <FormWrapper>
        <K6ChannelSelect />
      </FormWrapper>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/k6 version/i)).toBeInTheDocument();
    });
  });

  it('should auto-select the first available channel when default is deprecated', async () => {
    mockFeatureToggles({
      [FeatureName.VersionManagement]: true,
    });
    
    const channelsWithDeprecatedDefault = {
      channels: [
        {
          id: 'v1',
          name: 'v1',
          default: true,
          deprecatedAfter: '2020-01-01T00:00:00Z', // Already deprecated
          manifest: 'k6>=1,k6<2',
        },
        {
          id: 'v2',
          name: 'v2',
          default: false,
          deprecatedAfter: '2028-12-31T00:00:00Z', // Not deprecated
          manifest: 'k6>=2',
        },
      ],
    };

    server.use(
      apiRoute('listK6Channels', { 
        result: () => ({ json: channelsWithDeprecatedDefault }) 
      })
    );
    
    render(
      <FormWrapper>
        <K6ChannelSelect />
      </FormWrapper>
    );

    await waitFor(() => {
      const combobox = screen.getByLabelText(/k6 version/i);
      // v1 is the default but deprecated, so v2 should be selected as the first available
      expect(combobox).toHaveValue('v2.x');
    });
    
    // v1 should not be visible since it's deprecated for new checks
    expect(screen.queryByText(/v1\.x/i)).not.toBeInTheDocument();
  });

  it('should display error message when channels fail to load', async () => {
    mockFeatureToggles({
      [FeatureName.VersionManagement]: true,
    });
    
    server.use(
      apiRoute('listK6Channels', { 
        result: () => ({ status: 500, body: 'Failed to load K6 version channels. Please try again later.' }) 
      })
    );

    render(
      <FormWrapper>
        <K6ChannelSelect />
      </FormWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/error loading k6 version channels/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/failed to load version channels/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry request/i })).toBeInTheDocument();
  });

  it('should hide deprecated channels for new checks', async () => {
    setupChannelTest(); // Uses mockChannelsResponse which has only non-deprecated channels for new checks
    
    render(
      <FormWrapper>
        <K6ChannelSelect />
      </FormWrapper>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/k6 version/i)).toBeInTheDocument();
    });
    
    // Should have v1 selected (the default)
    const combobox = screen.getByLabelText(/k6 version/i);
    await waitFor(() => {
      expect(combobox).toHaveValue('v1.x (default)');
    });
  });

  it('should show deprecated channel for existing checks if it was previously assigned', async () => {
    mockFeatureToggles({
      [FeatureName.VersionManagement]: true,
    });
    
    const channelsWithDeprecated = {
      channels: [
        {
          id: 'v1',
          name: 'v1',
          default: true,
          deprecatedAfter: '2025-12-31T00:00:00Z', // Not deprecated
          manifest: 'k6>=1,k6<2',
        },
        {
          id: 'deprecated',
          name: 'deprecated',
          default: false,
          deprecatedAfter: '2020-01-01T00:00:00Z', // Already deprecated
          manifest: 'k6>=0.5,k6<1',
        },
      ],
    };

    const existingCheck = { 
      id: 1,
      settings: { 
        browser: { 
          script: 'test script',
          channel: 'deprecated' 
        } 
      } 
    };

    server.use(
      apiRoute('listK6Channels', { 
        result: () => ({ json: channelsWithDeprecated }) 
      })
    );

    render(
      <FormWrapper check={existingCheck} checkType={CheckType.Browser}>
        <K6ChannelSelect />
      </FormWrapper>
    );

    await waitFor(() => {
      const combobox = screen.getByLabelText(/k6 version/i);
      // Should have the deprecated channel selected since it was previously assigned
      expect(combobox).toHaveValue('deprecated');
    });
  });

});
