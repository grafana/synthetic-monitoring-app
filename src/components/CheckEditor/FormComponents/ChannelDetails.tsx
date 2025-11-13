import React from 'react';
import { dateTimeFormat, GrafanaTheme2 } from '@grafana/data';
import { Alert, Stack, Text, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { K6Channel } from 'types';

interface ChannelDetailsProps {
  channelId: string | null;
  channels: K6Channel[];
}

export function ChannelDetails({ channelId, channels }: ChannelDetailsProps) {
  const styles = useStyles2(getStyles);

  const validChannelId = channelId && typeof channelId === 'string' && channelId.trim() !== '' ? channelId : undefined;

  // Show default message when no specific channel is selected
  // This happens when no channels are available or when all channels are filtered out
  // (e.g., all are deprecated for new checks)
  if (!validChannelId) {
    return (
      <Text variant="bodySmall" color="secondary">
        Each probe will use its default k6 version.
      </Text>
    );
  }

  const channel = channels.find((ch) => ch.id === validChannelId);
  if (!channel) {
    return null;
  }

  const isDeprecated = new Date(channel.deprecatedAfter) < new Date();

  return (
    <Stack direction="column" gap={1}>
      <Text variant="bodySmall" color="secondary">
        k6 version constraint: <code className={styles.manifest}>{channel.manifest}</code>
      </Text>

      {isDeprecated && (
        <Alert severity="warning" title="Deprecated Channel">
          This channel is deprecated since {dateTimeFormat(new Date(channel.deprecatedAfter))}. Consider migrating to a
          newer channel.
        </Alert>
      )}
    </Stack>
  );
}

const getStyles = (theme: GrafanaTheme2) => {
  return {
    manifest: css({
      backgroundColor: theme.colors.background.secondary,
      color: theme.colors.text.primary,
      padding: '2px 6px',
      borderRadius: theme.shape.radius.default,
      fontSize: theme.typography.bodySmall.fontSize,
      fontFamily: theme.typography.fontFamilyMonospace,
    }),
  };
};
