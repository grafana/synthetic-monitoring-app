import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { render } from 'test/render';

import { K6Channel } from 'types';

import { ChannelDetails } from './ChannelDetails';

describe('ChannelDetails', () => {

  const mockChannels: K6Channel[] = [
    {
      id: 'v1',
      name: 'v1.x',
      default: false,
      deprecatedAfter: '2126-07-01T00:00:00Z', // Not yet deprecated
      manifest: 'k6>=1',
    },
    {
      id: 'v2',
      name: 'v2.x',
      default: true,
      deprecatedAfter: '2128-12-31T00:00:00Z',
      manifest: 'k6>=2',
    },
    {
      id: 'deprecated',
      name: 'deprecated.x',
      default: false,
      deprecatedAfter: '2020-01-01T00:00:00Z', // Already deprecated
      manifest: 'k6>=0.5',
    },
  ];

  it('should show probe default message when no channels are available', async () => {
    render(<ChannelDetails channelId={null} channels={[]} />);

    await waitFor(() => {
      expect(screen.getByText(/each probe will use its default k6 version/i)).toBeInTheDocument();
    });
  });

  it('should show channel details when the default channel is selected', async () => {
    render(<ChannelDetails channelId="v2" channels={mockChannels} />);

    await waitFor(() => {
      expect(screen.getByText(/k6 version constraint:/i)).toBeInTheDocument();
      expect(screen.getByText(/k6>=2/)).toBeInTheDocument();
    });

    expect(screen.queryByText(/newer version available/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/deprecated k6 version channel/i)).not.toBeInTheDocument();
  });

  it('should show info message when a non-default, non-deprecated channel is selected', async () => {
    render(<ChannelDetails channelId="v1" channels={mockChannels} />);

    await waitFor(() => {
      expect(screen.getByText(/k6 version constraint:/i)).toBeInTheDocument();
      expect(screen.getByText(/k6>=1/)).toBeInTheDocument();
    });

    expect(screen.getByText(/newer version available/i)).toBeInTheDocument();
    expect(screen.getByText(/v2 is now the recommended default/i)).toBeInTheDocument();
  });

  it('should show deprecation warning for deprecated channels', async () => {
    render(<ChannelDetails channelId="deprecated" channels={mockChannels} />);

    await waitFor(() => {
      expect(screen.getByText(/deprecated k6 version channel/i)).toBeInTheDocument();
      expect(screen.getByText(/your checks continue to run/i)).toBeInTheDocument();
      expect(screen.getByText(/we recommend switching to a supported channel \(v2\)/i)).toBeInTheDocument();
    });
  });

  it('should show v1-specific deprecation warning when v1 is deprecated', async () => {
    const channels: K6Channel[] = [
      ...mockChannels.filter((ch) => ch.id !== 'v1'),
      {
        id: 'v1',
        name: 'v1.x',
        default: false,
        deprecatedAfter: '2020-01-01T00:00:00Z',
        manifest: 'k6>=1,k6<2',
      },
    ];

    render(<ChannelDetails channelId="v1" channels={channels} />);

    await waitFor(() => {
      expect(screen.getByText(/we recommend switching this check to the v2 k6 version channel/i)).toBeInTheDocument();
      expect(screen.getByText(/most scripted and browser checks do not need script changes/i)).toBeInTheDocument();
      const migrationGuide = screen.getByRole('link', { name: /k6 v2 migration guide/i });
      expect(migrationGuide).toHaveAttribute('href', 'https://grafana.com/docs/k6/latest/get-started/migrating-to-v2/');
    });
  });

  it('should handle missing channel gracefully', async () => {
    render(<ChannelDetails channelId="nonexistent" channels={mockChannels} />);

    await waitFor(() => {
      expect(screen.queryByText(/k6 version constraint:/i)).not.toBeInTheDocument();
    });
  });

});
