import React from 'react';
import { Alert, Text } from '@grafana/ui';

import { K6Channel, Probe } from 'types';
import { useCurrentK6Version } from 'data/useK6Channels';

interface ChannelDetailsProps {
  channelId: string | null;
  channels: Record<string, K6Channel>;
  selectedProbes?: Probe[];
}

export function ChannelDetails({ channelId, channels, selectedProbes }: ChannelDetailsProps) {
  const { data: currentVersion, isLoading: isLoadingVersion } = useCurrentK6Version(channelId || undefined);

  if (!channelId) {
    return (
      <div className="channel-details">
        <Text variant="bodySmall" color="secondary">
          Each probe will use its default k6 version. This may vary between probes.
        </Text>
        {selectedProbes && (
          <div style={{ marginTop: '8px' }}>
            <Text variant="bodySmall" color="secondary">
              Probe versions:
            </Text>
            {selectedProbes.map((probe) => (
              <div key={probe.name} style={{ marginLeft: '16px' }}>
                <Text variant="bodySmall">
                  {probe.name}: {probe.k6Version || 'Unknown'}
                  {!probe.supportsBinaryProvisioning && (
                    <Text variant="bodySmall" color="secondary">
                      {' '}
                      (legacy)
                    </Text>
                  )}
                </Text>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  const channel = channels[channelId];
  if (!channel) {
    return null;
  }

  const isDeprecated = new Date(channel.deprecatedAfter) < new Date();

  return (
    <div className="channel-details">
      <Text variant="bodySmall" color="secondary">
        k6 version constraint: {channel.manifest}
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

      {/* Show probe compatibility information */}
      {selectedProbes && selectedProbes.length > 0 && (
        <div style={{ marginTop: '8px' }}>
          <Text variant="bodySmall" color="secondary">
            Probe compatibility:
          </Text>
          {selectedProbes.map((probe) => {
            const isModernProbe = probe.supportsBinaryProvisioning;
            const versionToShow = isModernProbe ? currentVersion : probe.k6Version;

            return (
              <div key={probe.name} style={{ marginLeft: '16px' }}>
                <Text variant="bodySmall">
                  {probe.name}: {versionToShow || 'Unknown'}
                  {!isModernProbe && (
                    <Text variant="bodySmall" color="secondary">
                      {' '}
                      (static, legacy probe)
                    </Text>
                  )}
                </Text>
              </div>
            );
          })}
        </div>
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
