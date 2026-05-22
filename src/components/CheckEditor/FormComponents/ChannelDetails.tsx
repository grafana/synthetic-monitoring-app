import React from 'react';
import { dateTimeFormat, GrafanaTheme2 } from '@grafana/data';
import { Alert, Stack, Text, TextLink, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { K6Channel } from 'types';

const K6_V2_MIGRATION_DOC_URL = 'https://grafana.com/docs/k6/latest/get-started/migrating-to-v2/';

interface ChannelDetailsProps {
  channelId: string | null;
  channels: K6Channel[];
}

export function ChannelDetails({ channelId, channels }: ChannelDetailsProps) {
  const styles = useStyles2(getStyles);

  const validChannelId = channelId && typeof channelId === 'string' && channelId.trim() !== '' ? channelId : undefined;

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
  const isV1PreDeprecation = channel.id === 'v1' && !isDeprecated;

  return (
    <Stack direction="column" gap={1}>
      <Text variant="bodySmall" color="secondary">
        k6 version constraint: <code className={styles.manifest}>{channel.manifest}</code>
      </Text>

      {isDeprecated && (
        <Alert severity="warning" title="Deprecated k6 version channel">
          {channel.id === 'v1' ? (
            <>
              This channel was deprecated on {dateTimeFormat(new Date(channel.deprecatedAfter))}. Your checks continue
              to run. We recommend switching this check to the v2 k6 version channel. Most scripted and browser checks
              do not need script changes. If a check fails after switching, see the{' '}
              <TextLink href={K6_V2_MIGRATION_DOC_URL} external>
                k6 v2 migration guide
              </TextLink>
              .
            </>
          ) : (
            <>
              This channel was deprecated on {dateTimeFormat(new Date(channel.deprecatedAfter))}. Your checks continue
              to run. We recommend switching to a supported channel (v2).
            </>
          )}
        </Alert>
      )}

      {isV1PreDeprecation && (
        <Alert severity="info" title="Newer version available">
          v2 is now the recommended default. v1 will be deprecated in the coming weeks. Support for this version is
          expected to end with the release of k6 v3 (~May 2027).
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
