import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { apiRoute } from 'test/handlers';
import { render } from 'test/render';
import { server } from 'test/server';
import { mockFeatureToggles } from 'test/utils';

import { CheckType, FeatureName } from 'types';
import { testUsesCombobox } from 'test/utils';
import { ChecksterProvider } from 'components/Checkster/contexts/ChecksterContext';
import { setupChannelTest } from 'page/__testHelpers__/channel';

import { K6ChannelSelect } from './K6ChannelSelect';

const FormWrapper = ({ 
  children, 
  checkType = CheckType.Browser 
}: { 
  children: React.ReactNode; 
  checkType?: CheckType;
  }) => {
    return (
      <ChecksterProvider checkType={checkType}>
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

  it('should auto-select the default channel (v2)', async () => {
    setupChannelTest();
    
    render(
      <FormWrapper>
        <K6ChannelSelect />
      </FormWrapper>
    );

    await waitFor(() => {
      const combobox = screen.getByLabelText(/k6 version/i);
      expect(combobox).toHaveValue('v2.x (default)');
    });
  });

  it('should allow selecting a deprecated channel', async () => {
    testUsesCombobox();
    mockFeatureToggles({
      [FeatureName.VersionManagement]: true,
    });
    
    const channelsWithDeprecated = {
      channels: [
        {
          id: 'v1',
          name: 'v1.x',
          default: false,
          deprecatedAfter: '2020-01-01T00:00:00Z', // Already deprecated
          manifest: 'k6>=1,k6<2',
        },
        {
          id: 'v2',
          name: 'v2.x',
          default: true,
          deprecatedAfter: '2128-12-31T00:00:00Z',
          manifest: 'k6>=2',
        },
      ],
    };

    server.use(
      apiRoute('listK6Channels', { 
        result: () => ({ json: channelsWithDeprecated }) 
      })
    );
    
    const user = userEvent.setup();

    render(
      <FormWrapper>
        <K6ChannelSelect />
      </FormWrapper>
    );

    await waitFor(() => {
      const combobox = screen.getByLabelText(/k6 version/i);
      expect(combobox).toHaveValue('v2.x (default)');
    });

    const combobox = screen.getByLabelText(/k6 version/i);
    await user.click(combobox);
    await user.click(screen.getByRole('option', { name: /v1\.x/ }));

    await waitFor(() => {
      expect(combobox).toHaveValue('v1.x');
    });
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
});
