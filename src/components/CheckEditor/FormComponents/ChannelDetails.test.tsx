import React from 'react';
import { render, screen } from '@testing-library/react';

import { K6ChannelWithCurrent } from 'types';

import { ChannelDetails } from './ChannelDetails';

jest.mock('data/useK6Channels', () => ({
  useCurrentK6Version: jest.fn(),
}));

const { useCurrentK6Version } = require('data/useK6Channels');
const mockUseCurrentK6Version = useCurrentK6Version as jest.MockedFunction<typeof useCurrentK6Version>;

describe('ChannelDetails', () => {
  const mockChannels: Record<string, K6ChannelWithCurrent> = {
    v1: {
      name: 'v1',
      default: false,
      deprecatedAfter: '2025-12-31T00:00:00Z',
      manifest: 'k6>=1',
      currentVersion: 'v1.9.2',
    },
    v2: {
      name: 'v2',
      default: true,
      deprecatedAfter: '2026-12-31T00:00:00Z',
      manifest: 'k6>=2',
      currentVersion: 'v2.0.1',
    },
    deprecated: {
      name: 'deprecated',
      default: false,
      deprecatedAfter: '2020-01-01T00:00:00Z', // Already deprecated
      manifest: 'k6>=0.5',
      currentVersion: 'v0.54.1',
    },
  };



  beforeEach(() => {
    mockUseCurrentK6Version.mockReturnValue({
      data: 'v1.9.2',
      isLoading: false,
      error: null,
      isError: false,
      isSuccess: true,
      isPending: false,
      isStale: false,
      dataUpdatedAt: Date.now(),
      refetch: jest.fn(),
    });
  });

  it('should show probe default message when no channel is selected', () => {
    render(
      <ChannelDetails
        channelId={null}
        channels={mockChannels}
      />
    );

    expect(screen.getByText(/each probe will use its default k6 version/i)).toBeInTheDocument();
  });



  it('should show channel details when a channel is selected', () => {
    render(
      <ChannelDetails
        channelId="v1"
        channels={mockChannels}
      />
    );

    expect(screen.getByText(/k6 version constraint:/i)).toBeInTheDocument();
    expect(screen.getByText(/k6>=1/)).toBeInTheDocument();
    expect(screen.getByText(/current resolved version:/i)).toBeInTheDocument();
    expect(screen.getByText(/v1\.9\.2/)).toBeInTheDocument();
  });



  it('should show deprecation warning for deprecated channels', () => {
    render(
      <ChannelDetails
        channelId="deprecated"
        channels={mockChannels}
      />
    );

    expect(screen.getByText(/deprecated channel/i)).toBeInTheDocument();
    expect(screen.getByText(/will be removed after/i)).toBeInTheDocument();
  });

  it('should handle missing channel gracefully', () => {
    render(
      <ChannelDetails
        channelId="nonexistent"
        channels={mockChannels}
      />
    );

    // Should render nothing when channel doesn't exist
    expect(screen.queryByText(/k6 version constraint/i)).not.toBeInTheDocument();
  });
});
