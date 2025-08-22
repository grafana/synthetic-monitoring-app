import React from 'react';
import { Alert, Stack, Text, useTheme2 } from '@grafana/ui';

import { K6Channel } from 'types';
import { useCurrentK6Version } from 'data/useK6Channels';

interface ChannelDetailsProps {
  channelId: string | null;
  channels: Record<string, K6Channel>;
  enabled?: boolean;
}

export function ChannelDetails({ channelId, channels, enabled = true }: ChannelDetailsProps) {
  const theme = useTheme2();

  const validChannelId = channelId && typeof channelId === 'string' && channelId.trim() !== '' ? channelId : undefined;
  const { data: currentVersion, isLoading: isLoadingVersion } = useCurrentK6Version(validChannelId, enabled);

  if (!validChannelId) {
    return (
      <Text variant="bodySmall" color="secondary">
        Each probe will use its default k6 version.
      </Text>
    );
  }

  const channel = channels[validChannelId];
  if (!channel) {
    return null;
  }

  const isDeprecated = new Date(channel.deprecatedAfter) < new Date();

  return (
    <Stack direction="column" gap={1}>
      <Text variant="bodySmall" color="secondary">
        k6 version constraint:{' '}
        <code
          style={{
            backgroundColor: theme.colors.background.secondary,
            color: theme.colors.text.primary,
            padding: '2px 6px',
            borderRadius: theme.shape.radius.default,
            fontSize: theme.typography.bodySmall.fontSize,
            fontFamily: theme.typography.fontFamilyMonospace,
          }}
        >
          {channel.manifest}
        </code>
      </Text>
      
      {currentVersion && (
        <Text variant="bodySmall">
          Current resolved version: <strong>{currentVersion}</strong>
        </Text>
      )}
      
      {isLoadingVersion && (
        <Text variant="bodySmall" color="secondary">
          Loading current version...
        </Text>
      )}

      {isDeprecated && (
        <Alert severity="warning" title="Deprecated Channel">
          This channel is deprecated and will be removed after {new Date(channel.deprecatedAfter).toLocaleDateString()}.
          Consider migrating to a newer channel.
        </Alert>
      )}
    </Stack>
  );
}
