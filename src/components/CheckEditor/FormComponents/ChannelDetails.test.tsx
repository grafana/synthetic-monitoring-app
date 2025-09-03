import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { apiRoute } from 'test/handlers';
import { render } from 'test/render';
import { server } from 'test/server';

import { K6Channel } from 'types';

import { ChannelDetails } from './ChannelDetails';

describe('ChannelDetails', () => {
  beforeEach(() => {
    server.use(
      apiRoute('getCurrentK6Version', { 
        result: () => ({ json: { version: 'v1.9.2' } }) 
      })
    );
  });

  const mockChannels: K6Channel[] = [
    {
      id: 'v1',
      name: 'v1',
      default: false,
      deprecatedAfter: '2025-12-31T00:00:00Z',
      disabledAfter: '2026-12-31T00:00:00Z',
      manifest: 'k6>=1',
    },
    {
      id: 'v2',
      name: 'v2',
      default: true,
      deprecatedAfter: '2026-12-31T00:00:00Z',
      disabledAfter: '2027-12-31T00:00:00Z',
      manifest: 'k6>=2',
    },
    {
      id: 'deprecated',
      name: 'deprecated',
      default: false,
      deprecatedAfter: '2020-01-01T00:00:00Z', // Already deprecated
      disabledAfter: '2030-01-01T00:00:00Z', // Not yet disabled
      manifest: 'k6>=0.5',
    },
  ];

  it('should show probe default message when no channel is selected', async () => {
    render(
      <ChannelDetails
        channelId={null}
        channels={mockChannels}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/each probe will use its default k6 version/i)).toBeInTheDocument();
    });
  });

  it('should show channel details when a channel is selected', async () => {
    render(
      <ChannelDetails
        channelId="v1"
        channels={mockChannels}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/k6 version constraint:/i)).toBeInTheDocument();
      expect(screen.getByText(/k6>=1/)).toBeInTheDocument();
    });
    
    // Wait for the API call to resolve
    await waitFor(() => {
      expect(screen.getByText(/current resolved version:/i)).toBeInTheDocument();
      expect(screen.getByText(/v1\.9\.2/)).toBeInTheDocument();
    });
  });

  it('should show deprecation warning for deprecated channels', async () => {
    // Override default mock for this specific test
    server.use(
      apiRoute('getCurrentK6Version', { 
        result: () => ({ json: { version: 'v0.54.1' } }) 
      })
    );

    render(
      <ChannelDetails
        channelId="deprecated"
        channels={mockChannels}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/deprecated channel/i)).toBeInTheDocument();
      expect(screen.getByText(/will be removed after/i)).toBeInTheDocument();
    });
  });

  it('should handle missing channel gracefully', async () => {
    render(
      <ChannelDetails
        channelId="nonexistent"
        channels={mockChannels}
      />
    );

    await waitFor(() => {
      expect(screen.queryByText(/k6 version constraint:/i)).not.toBeInTheDocument();
    });
  });
});
