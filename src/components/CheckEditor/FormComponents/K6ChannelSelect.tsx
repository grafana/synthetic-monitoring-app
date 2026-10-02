import React, { useEffect, useId, useMemo } from 'react';
import { useController, useFormContext } from 'react-hook-form';
import { Combobox } from '@grafana/ui';
import { css } from '@emotion/css';
import { trackK6ChannelRetryClicked, trackK6ChannelSelected } from 'features/tracking/checkFormEvents';

import { CheckFormValues, FeatureName } from 'types';
import { useFilteredK6Channels } from 'data/useK6Channels';
import { FeatureFlag } from 'components/FeatureFlag';
import { QueryErrorBoundary } from 'components/QueryErrorBoundary';

interface K6ChannelSelectProps {
  disabled?: boolean;
}

export function K6ChannelSelect({ disabled }: K6ChannelSelectProps) {
  return (
    <FeatureFlag name={FeatureName.VersionManagement}>
      {({ isEnabled }) =>
        isEnabled ? (
          <QueryErrorBoundary
            title="Error loading K6 version channels"
            content="Failed to load version channels. Please check your connection and try again."
            onRetry={trackK6ChannelRetryClicked}
          >
            <K6ChannelSelectContent disabled={disabled} />
          </QueryErrorBoundary>
        ) : null
      }
    </FeatureFlag>
  );
}

function K6ChannelSelectContent({ disabled }: K6ChannelSelectProps) {
  const { control, getValues, setValue } = useFormContext<CheckFormValues>();
  const id = 'k6-channel-select';
  const labelId = useId();

  const checkType = getValues('checkType');

  const { field } = useController({
    control,
    name: 'channels.k6',
  });

  const {
    channels,
    defaultChannelId,
    isLoading: isLoadingChannels,
    isError: hasChannelError,
    error: channelError,
  } = useFilteredK6Channels(true);

  // Initialize with default channel when no channel is set (new checks or existing checks without channel).
  // shouldDirty: false - a system default shouldn't make a pristine check look unsaved.
  useEffect(() => {
    if (!field.value && defaultChannelId && !isLoadingChannels) {
      const defaultChannel = channels.find((channel) => channel.id === defaultChannelId);
      if (defaultChannel) {
        setValue('channels.k6', defaultChannel, { shouldDirty: false });
      }
    }
  }, [field.value, defaultChannelId, isLoadingChannels, channels, setValue]);

  // Throw error to be caught by QueryErrorBoundary if there's an error
  if (hasChannelError && channelError) {
    throw channelError;
  }

  const channelOptions = useMemo(() => {
    return channels.map((channel) => {
      const isDeprecated = new Date(channel.deprecatedAfter) < new Date();
      const labelSuffix = channel.default ? ' (default)' : '';
      const description = isDeprecated
        ? `Deprecated · k6 ${channel.manifest}`
        : `k6 ${channel.manifest}`;

      return {
        label: `${channel.name}${labelSuffix}`,
        value: channel.id,
        description,
      };
    });
  }, [channels]);

  const selectedChannelId = field.value?.id || defaultChannelId;

  return (
    <>
      <span className={hiddenLabelStyle} id={labelId}>
        k6 runtime version
      </span>
      <Combobox
        {...field}
        aria-labelledby={labelId}
        prefixIcon="k6-rounded"
        value={selectedChannelId}
        disabled={disabled || isLoadingChannels}
        options={channelOptions}
        id={id}
        width={20}
        createCustomValue={false}
        onChange={(value) => {
          const channelId = typeof value === 'string' ? value : value?.value || '';
          const selectedChannel = channels.find((channel) => channel.id === channelId);

          if (selectedChannel) {
            field.onChange(selectedChannel);
            trackK6ChannelSelected({
              checkType,
              channelName: selectedChannel.name,
            });
          }
        }}
        placeholder={isLoadingChannels ? 'Loading…' : 'Select version'}
        data-fs-element="k6 channel select"
      />
    </>
  );
}

const hiddenLabelStyle = css`
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
`;
