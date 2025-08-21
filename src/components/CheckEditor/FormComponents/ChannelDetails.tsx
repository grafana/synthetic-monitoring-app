import React from 'react';
import { Alert, Text } from '@grafana/ui';

import { K6ChannelWithCurrent } from 'types';

interface ChannelDetailsProps {
  channelId: string | null;
  channels: Record<string, K6ChannelWithCurrent>;
}

export function ChannelDetails({ channelId, channels }: ChannelDetailsProps) {
  if (!channelId) {
    return (
      <div className="channel-details">
        <Text variant="bodySmall" color="secondary">
          Each probe will use its default k6 version. This may vary between probes.
        </Text>
      </div>
    );
  }
  
  const channel = channels[channelId];
  if (!channel) return null;

  const isDeprecated = new Date(channel.deprecatedAfter) < new Date();

  return (
    <div className="channel-details">
      <Text variant="bodySmall" color="secondary">
        k6 version constraint: {channel.manifest}
      </Text>
      {channel.currentVersion && (
        <Text variant="bodySmall">
          Current resolved version: <strong>{channel.currentVersion}</strong>
        </Text>
      )}
      {isDeprecated && (
        <Alert severity="warning" title="Deprecated Channel">
          This channel is deprecated and will be removed after {new Date(channel.deprecatedAfter).toLocaleDateString()}.
          Consider migrating to a newer channel.
        </Alert>
      )}
    </div>
  );
}
