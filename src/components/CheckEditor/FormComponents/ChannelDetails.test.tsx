import React from 'react';
import { render, screen } from '@testing-library/react';

import { K6ChannelWithCurrent, Probe } from 'types';

import { ChannelDetails } from './ChannelDetails';

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

  const mockLegacyProbe: Probe = {
    id: 1,
    name: 'legacy-probe',
    public: true,
    latitude: 0,
    longitude: 0,
    region: 'test',
    online: true,
    onlineChange: 0,
    labels: [],
    version: '1.0.0',
    k6Version: 'v0.54.1',
    supportsBinaryProvisioning: false,
  };

  const mockModernProbe: Probe = {
    id: 2,
    name: 'modern-probe',
    public: true,
    latitude: 0,
    longitude: 0,
    region: 'test',
    online: true,
    onlineChange: 0,
    labels: [],
    version: '2.0.0',
    supportsBinaryProvisioning: true,
  };

  it('should show probe default message when no channel is selected', () => {
    render(
      <ChannelDetails
        channelId={null}
        channels={mockChannels}
      />
    );

    expect(screen.getByText(/each probe will use its default k6 version/i)).toBeInTheDocument();
  });

  it('should show probe versions when no channel is selected and probes are provided', () => {
    render(
      <ChannelDetails
        channelId={null}
        channels={mockChannels}
        selectedProbes={[mockLegacyProbe, mockModernProbe]}
      />
    );

    expect(screen.getByText(/probe versions:/i)).toBeInTheDocument();
    expect(screen.getByText(/legacy-probe: v0\.54\.1/)).toBeInTheDocument();
    expect(screen.getByText(/modern-probe: Unknown/)).toBeInTheDocument();
    expect(screen.getByText(/\(legacy\)/)).toBeInTheDocument();
  });

  it('should show channel details when a channel is selected', () => {
    render(
      <ChannelDetails
        channelId="v1"
        channels={mockChannels}
      />
    );

    expect(screen.getByText(/k6 version constraint: k6>=1/i)).toBeInTheDocument();
    expect(screen.getByText(/current resolved version:/i)).toBeInTheDocument();
    expect(screen.getByText(/v1\.9\.2/)).toBeInTheDocument();
  });

  it('should show probe compatibility when channel and probes are provided', () => {
    render(
      <ChannelDetails
        channelId="v2"
        channels={mockChannels}
        selectedProbes={[mockLegacyProbe, mockModernProbe]}
      />
    );

    expect(screen.getByText(/probe compatibility:/i)).toBeInTheDocument();
    expect(screen.getByText(/legacy-probe: v0\.54\.1/)).toBeInTheDocument();
    expect(screen.getByText(/modern-probe: v2\.0\.1/)).toBeInTheDocument();
    expect(screen.getByText(/\(static, legacy probe\)/)).toBeInTheDocument();
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
