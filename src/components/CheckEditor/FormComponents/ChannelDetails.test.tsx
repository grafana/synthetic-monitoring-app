import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { render } from 'test/render';

import { K6Channel } from 'types';

import { ChannelDetails } from './ChannelDetails';

describe('ChannelDetails', () => {

  const mockChannels: K6Channel[] = [
    {
      id: 'v1',
      name: 'v1',
      default: false,
      deprecatedAfter: '2025-12-31T00:00:00Z',
      manifest: 'k6>=1',
    },
    {
      id: 'v2',
      name: 'v2',
      default: true,
      deprecatedAfter: '2026-12-31T00:00:00Z',
      manifest: 'k6>=2',
    },
    {
      id: 'deprecated',
      name: 'deprecated',
      default: false,
      deprecatedAfter: '2020-01-01T00:00:00Z', // Already deprecated
      manifest: 'k6>=0.5',
    },
  ];

  it('should show probe default message when no channels are available', async () => {
    // This occurs when no k6 channels are configured on the backend,
    // so the API returns an empty array and no default channel can be determined
    render(<ChannelDetails channelId={null} channels={[]} />);

    await waitFor(() => {
      expect(screen.getByText(/each probe will use its default k6 version/i)).toBeInTheDocument();
    });
  });

  it('should show probe default message when all channels are deprecated', async () => {
    // This occurs when the backend returns channels but they are all deprecated,
    // so after filtering, no channels are available for new checks
    const allDeprecatedChannels: K6Channel[] = [
      {
        id: 'old-v1',
        name: 'old-v1',
        default: true,
        deprecatedAfter: '2020-01-01T00:00:00Z', // Already deprecated
        manifest: 'k6>=1,k6<2',
      },
      {
        id: 'old-v2',
        name: 'old-v2',
        default: false,
        deprecatedAfter: '2021-01-01T00:00:00Z', // Already deprecated
        manifest: 'k6>=2,k6<3',
      },
    ];

    render(<ChannelDetails channelId={null} channels={allDeprecatedChannels} />);

    await waitFor(() => {
      expect(screen.getByText(/each probe will use its default k6 version/i)).toBeInTheDocument();
    });
  });

  it('should show channel details when a channel is selected', async () => {
    render(<ChannelDetails channelId="v1" channels={mockChannels} />);

    await waitFor(() => {
      expect(screen.getByText(/k6 version constraint:/i)).toBeInTheDocument();
      expect(screen.getByText(/k6>=1/)).toBeInTheDocument();
    });
  });

  it('should show deprecation warning for deprecated channels', async () => {
    render(<ChannelDetails channelId="deprecated" channels={mockChannels} />);

    await waitFor(() => {
      expect(screen.getByText(/deprecated channel/i)).toBeInTheDocument();
      expect(screen.getByText(/consider migrating to a newer channel/i)).toBeInTheDocument();
    });
  });

  it('should handle missing channel gracefully', async () => {
    render(<ChannelDetails channelId="nonexistent" channels={mockChannels} />);

    await waitFor(() => {
      expect(screen.queryByText(/k6 version constraint:/i)).not.toBeInTheDocument();
    });
  });

});
