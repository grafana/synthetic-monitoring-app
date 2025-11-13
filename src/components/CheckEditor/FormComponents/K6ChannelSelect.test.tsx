import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { apiRoute } from 'test/handlers';
import { render } from 'test/render';
import { server } from 'test/server';
import { mockFeatureToggles } from 'test/utils';

import { CheckFormValuesBrowser, CheckType, FeatureName } from 'types';
import { ChecksterProvider } from 'components/Checkster/contexts/ChecksterContext';

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
    <ChecksterProvider checkType={checkType} check={check} k6Channels={[]}>
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
    mockFeatureToggles({
      [FeatureName.VersionManagement]: true,
    });
    
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
    mockFeatureToggles({
      [FeatureName.VersionManagement]: true,
    });
    
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
    
    render(
      <FormWrapper>
        <K6ChannelSelect />
      </FormWrapper>
    );

    await waitFor(() => {
      const combobox = screen.getByLabelText(/k6 version/i);
      // v1 is the default but deprecated, so v2 should be selected as the first available
      expect(combobox).toHaveValue('v2');
    });
    
    // v1 should not be in the options since it's deprecated for new checks
    const combobox = screen.getByLabelText(/k6 version/i);
    const selectElement = combobox as HTMLSelectElement;
    const v1Option = Array.from(selectElement.options).find(opt => opt.value === 'v1');
    expect(v1Option).toBeUndefined();
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

    server.use(
      apiRoute('listK6Channels', { 
        result: () => ({ json: channelsWithDeprecated }) 
      })
    );

    render(
      <FormWrapper>
        <K6ChannelSelect />
      </FormWrapper>
    );

    await waitFor(() => {
      const combobox = screen.getByLabelText(/k6 version/i) as HTMLSelectElement;
      const options = Array.from(combobox.options);
      
      // Should have v1 but not deprecated channel
      expect(options.some(opt => opt.value === 'v1')).toBe(true);
      expect(options.some(opt => opt.value === 'deprecated')).toBe(false);
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
      const combobox = screen.getByLabelText(/k6 version/i) as HTMLSelectElement;
      const options = Array.from(combobox.options);
      
      // Should have both v1 and deprecated channel since it was previously assigned
      expect(options.some(opt => opt.value === 'v1')).toBe(true);
      expect(options.some(opt => opt.value === 'deprecated')).toBe(true);
    });
  });

});
