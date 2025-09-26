import React from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { screen, waitFor } from '@testing-library/react';
import { apiRoute } from 'test/handlers';
import { render } from 'test/render';
import { server } from 'test/server';
import { mockFeatureToggles } from 'test/utils';

import { CheckFormValues, CheckFormValuesBrowser, CheckType, FeatureName } from 'types';
import { useCheckFormMetaContext } from 'components/CheckForm/CheckFormContext';

import { K6ChannelSelect } from './K6ChannelSelect';

jest.mock('components/CheckForm/CheckFormContext');

const mockUseCheckFormMetaContext = useCheckFormMetaContext as jest.Mock;

const FormWrapper = ({ children, defaultValues }: { children: React.ReactNode; defaultValues?: Partial<CheckFormValuesBrowser> }) => {
  const form = useForm<CheckFormValues>({ 
    defaultValues: {
      ...defaultValues,
      checkType: CheckType.Browser,
    }
  });
  return <FormProvider {...form}>{children}</FormProvider>;
};

describe('K6ChannelSelect', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseCheckFormMetaContext.mockReturnValue({
      check: undefined,
      isExistingCheck: false,
      getIsExistingCheck: () => false,
    });
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
          disabledAfter: '2026-12-31T00:00:00Z',
          manifest: 'k6>=1,k6<2',
        },
        {
          id: 'deprecated',
          name: 'deprecated',
          default: false,
          deprecatedAfter: '2020-01-01T00:00:00Z', // Already deprecated
          disabledAfter: '2027-12-31T00:00:00Z',
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
          disabledAfter: '2026-12-31T00:00:00Z',
          manifest: 'k6>=1,k6<2',
        },
        {
          id: 'deprecated',
          name: 'deprecated',
          default: false,
          deprecatedAfter: '2020-01-01T00:00:00Z', // Already deprecated
          disabledAfter: '2027-12-31T00:00:00Z',
          manifest: 'k6>=0.5,k6<1',
        },
      ],
    };

    mockUseCheckFormMetaContext.mockReturnValue({
      check: { 
        settings: { 
          browser: { 
            script: 'test script',
            channel: 'deprecated' 
          } 
        } 
      },
      isExistingCheck: true,
      getIsExistingCheck: () => true,
    });

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
      
      // Should have both v1 and deprecated channel since it was previously assigned
      expect(options.some(opt => opt.value === 'v1')).toBe(true);
      expect(options.some(opt => opt.value === 'deprecated')).toBe(true);
    });
  });

  it('should hide disabled channels for new checks', async () => {
    mockFeatureToggles({
      [FeatureName.VersionManagement]: true,
    });
    
    const channelsWithDisabled = {
      channels: [
        {
          id: 'v1',
          name: 'v1',
          default: true,
          deprecatedAfter: '2025-12-31T00:00:00Z',
          disabledAfter: '2026-12-31T00:00:00Z', // Not disabled
          manifest: 'k6>=1,k6<2',
        },
        {
          id: 'disabled',
          name: 'disabled',
          default: false,
          deprecatedAfter: '2025-12-31T00:00:00Z',
          disabledAfter: '2020-01-01T00:00:00Z', // Already disabled
          manifest: 'k6>=0.5,k6<1',
        },
      ],
    };

    server.use(
      apiRoute('listK6Channels', { 
        result: () => ({ json: channelsWithDisabled }) 
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
      
      expect(options.some(opt => opt.value === 'v1')).toBe(true);
      expect(options.some(opt => opt.value === 'disabled')).toBe(false);
    });
  });

  it('should show disabled channel for existing checks if it was previously assigned', async () => {
    mockFeatureToggles({
      [FeatureName.VersionManagement]: true,
    });
    
    const channelsWithDisabled = {
      channels: [
        {
          id: 'v1',
          name: 'v1',
          default: true,
          deprecatedAfter: '2025-12-31T00:00:00Z',
          disabledAfter: '2026-12-31T00:00:00Z', // Not disabled
          manifest: 'k6>=1,k6<2',
        },
        {
          id: 'disabled',
          name: 'disabled',
          default: false,
          deprecatedAfter: '2025-12-31T00:00:00Z',
          disabledAfter: '2020-01-01T00:00:00Z', // Already disabled
          manifest: 'k6>=0.5,k6<1',
        },
      ],
    };

    mockUseCheckFormMetaContext.mockReturnValue({
      check: { 
        settings: { 
          browser: { 
            script: 'test script',
            channel: 'disabled' 
          } 
        } 
      },
      isExistingCheck: true,
      getIsExistingCheck: () => true,
    });

    server.use(
      apiRoute('listK6Channels', { 
        result: () => ({ json: channelsWithDisabled }) 
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
      
      expect(options.some(opt => opt.value === 'v1')).toBe(true);
      expect(options.some(opt => opt.value === 'disabled')).toBe(true);
    });
  });

  it('should hide both deprecated and disabled channels for new checks', async () => {
    mockFeatureToggles({
      [FeatureName.VersionManagement]: true,
    });
    
    const channelsWithBoth = {
      channels: [
        {
          id: 'v1',
          name: 'v1',
          default: true,
          deprecatedAfter: '2025-12-31T00:00:00Z', // Not deprecated
          disabledAfter: '2026-12-31T00:00:00Z', // Not disabled
          manifest: 'k6>=1,k6<2',
        },
        {
          id: 'deprecated',
          name: 'deprecated',
          default: false,
          deprecatedAfter: '2020-01-01T00:00:00Z', // Already deprecated
          disabledAfter: '2027-12-31T00:00:00Z', // Not disabled
          manifest: 'k6>=0.5,k6<1',
        },
        {
          id: 'disabled',
          name: 'disabled',
          default: false,
          deprecatedAfter: '2025-12-31T00:00:00Z', // Not deprecated
          disabledAfter: '2020-01-01T00:00:00Z', // Already disabled
          manifest: 'k6>=0.3,k6<1',
        },
      ],
    };

    server.use(
      apiRoute('listK6Channels', { 
        result: () => ({ json: channelsWithBoth }) 
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
      
      expect(options.some(opt => opt.value === 'v1')).toBe(true);
      expect(options.some(opt => opt.value === 'deprecated')).toBe(false);
      expect(options.some(opt => opt.value === 'disabled')).toBe(false);
    });
  });
});
