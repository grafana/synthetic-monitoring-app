import React, { useMemo } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { Combobox, Field, Stack } from '@grafana/ui';

import { CheckFormValues, FeatureName } from 'types';
import { useK6Channels } from 'data/useK6Channels';
import { useFeatureFlag } from 'hooks/useFeatureFlag';

import { ChannelDetails } from './ChannelDetails';

interface K6ChannelSelectProps {
  disabled?: boolean;
}

export function K6ChannelSelect({ disabled }: K6ChannelSelectProps) {
  const { isEnabled } = useFeatureFlag(FeatureName.VersionManagement);
  const { control } = useFormContext<CheckFormValues>();
  const id = 'k6-channel-select';

  const { data: channelsResponse, isLoading: isLoadingChannels } = useK6Channels();

  const channels = useMemo(() => channelsResponse?.channels || {}, [channelsResponse?.channels]);

  const channelOptions = useMemo(() => {
    const options = [
      {
        label: 'Probe Default',
        value: '',
        description: 'Use the default k6 version of each probe',
      },
    ];

    Object.entries(channels).forEach(([channelId, channel]) => {
      options.push({
        label: `${channel.name}.x`,
        value: channelId,
        description: `k6 version range: ${channel.manifest}`,
      });
    });

    return options;
  }, [channels]);

  if (!isEnabled) {
    return null;
  }

  return (
    <Field
      label="k6 Version"
      description="Select the k6 version channel for this check"
      htmlFor={id}
      data-fs-element="k6 channel select"
    >
      <Controller
        name="channel"
        control={control}
        render={({ field, fieldState }) => {
          const { ref, onChange, ...rest } = field;
          return (
            <Stack direction="column" gap={2}>
              <Combobox
                {...rest}
                disabled={disabled || isLoadingChannels}
                options={channelOptions}
                id={id}
                createCustomValue={false}
                onChange={(value) => {
                  const channelValue = typeof value === 'string' ? value : value?.value || '';
                  onChange(channelValue);
                }}
                placeholder={isLoadingChannels ? 'Loading channels...' : 'Select k6 version channel'}
                invalid={!!fieldState.error}
              />

              <ChannelDetails channelId={field.value || null} channels={channels} />
            </Stack>
          );
        }}
      />
    </Field>
  );
}
